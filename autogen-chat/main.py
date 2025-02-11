import autogen
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from typing import List
import psycopg2
from fastapi.middleware.cors import CORSMiddleware
import logging


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fetch_team_data():
        conn = psycopg2.connect("postgres://postgres:example@localhost:5432/multiagent")
        cur = conn.cursor()
        cur.execute("SELECT name, role, skills FROM employees;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows

def insert_project(name: str, description: str, lead_id: int) -> int:
    conn = psycopg2.connect("postgres://postgres:example@localhost:5432/multiagent")
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO projects (name, description, lead_id) VALUES (%s, %s, %s) RETURNING id",
        (name, description, lead_id)
    )
    project_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return project_id

def insert_task(project_id: int, assigned_to: int, title: str, description: str):
    conn = psycopg2.connect("postgres://postgres:example@localhost:5432/multiagent")
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tasks (project_id, assigned_to, title, description) VALUES (%s, %s, %s, %s)",
        (project_id, assigned_to, title, description)
    )
    conn.commit()
    cur.close()
    conn.close()

class ProjectTeam:
    def __init__(self, model="llama3.2", api_type="ollama", stream=False):
        self.config_list = [{
                    "model": "gpt-4o",
                    "api_key": ""
                }]
        self.agents = {}
        self.groupchat = None
        self.manager = None
    
    def setup_team(self):
        team_data = fetch_team_data()
        team_info_str="\n".join(f"- {name} (Role: {role}, Skills: {', '.join(skills)})"for (name, role, skills) in team_data)
        print(team_info_str)
        self.agents["project_manager"] = autogen.AssistantAgent(
            name="ProjectManager",
            system_message=f"""You are a project manager. Your tasks:
1. Parse team members and their skills from the input
2. Break down project requirements into specific tasks
3. Assign tasks to team members based on their skills
4. Create a structured output in this format:
Team Analysis:
- Use this list of employees to assign tasks
  : {team_info_str}
Tasks Breakdown:
- [Task ID] Task description
- Assigned to: [Team member]""",
            llm_config={"config_list": self.config_list}
        )

        self.agents["architect"] = autogen.AssistantAgent(
            name="Architect",
            system_message="""You are a system architect. Your tasks:
1. Review the project requirements and task breakdown
2. Suggest technical architecture and frameworks
3. Identify potential technical challenges
4. Ensure tasks align with architectural best practices
5. Provide technical guidance for each task""",
            llm_config={"config_list": self.config_list}
        )

     
        self.agents["task_assigner"] = autogen.AssistantAgent(
            name="TaskAssigner",
            system_message="""You are a task assigner. Output format must be EXACTLY:
[Task] {PersonName}

Rules:
- Only task and name
- One per line
- [Task ID] in square brackets
- Names in curly braces
- No other text or formatting""",
            llm_config={"config_list": self.config_list}
        )


        self.agents["user_proxy"] = autogen.UserProxyAgent(
            name="UserProxy",
            code_execution_config=False,
            human_input_mode="TERMINATE"
        )

        # Define agent order explicitly
        agent_order = [
            self.agents["project_manager"],
            self.agents["architect"],
            self.agents["task_assigner"],
        ]

        self.groupchat = autogen.GroupChat(
            agents=agent_order + [self.agents["user_proxy"]],
            messages=[],
            max_round=3  # Limit rounds to ensure task_assigner gets last word
        )

        self.manager = autogen.GroupChatManager(
            groupchat=self.groupchat,
            llm_config={"config_list": self.config_list}
        )

    def get_chat_messages(self):
        if not self.groupchat:
            return []
        # Get only task_assigner messages
        return [msg.get("content", "") for msg in self.groupchat.messages 
                if msg.get("name") == "TaskAssigner"]
    
    def start_project(self, requirements):
        if not self.manager or not self.agents.get("user_proxy"):
            self.setup_team()
            
        self.agents["user_proxy"].initiate_chat(
            self.manager,
            message=requirements
        )
        
        # Return last task_assigner message
        messages = self.get_chat_messages()
        return messages[-1] if messages else "No task assignments generated"

class ChatRequest(BaseModel):
    prompt: str
    project_name: str
    project_description: str

class TaskAssignment(BaseModel):
    task: str
    assigned_to: str
    description: str  # Add description field

class AgentMessage(BaseModel):
    speaker: str
    message: str

class ChatResponse(BaseModel):
    status: str
    message: str
    tasks: List[TaskAssignment]
    project_manager_message: Optional[str] = None  # Add project_manager_message field
    task_assigner_message: Optional[str] = None  # Add task_assigner_message field

def parse_assignments(text: str) -> List[TaskAssignment]:
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    assignments = []
    for line in lines:
        task_start = line.find('[')
        task_end = line.find(']')
        person_start = line.find('{')
        person_end = line.find('}')
        
        if task_start != -1 and task_end != -1 and person_start != -1 and person_end != -1:
            task = line[task_start+1:task_end]
            person = line[person_start+1:person_end]
            description = line[task_end+1:person_start].strip(" -")
            assignments.append(TaskAssignment(task=task, assigned_to=person, description=description))
    
    return assignments

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    team = ProjectTeam()
    try:
        raw_tasks = team.start_project(request.prompt)
        logging.info(f"Raw tasks: {raw_tasks}")
        tasks = parse_assignments(raw_tasks)
        logging.info(f"Parsed tasks: {tasks}")
        
        # Create a detailed message
        team_data = fetch_team_data()
        team_info_str = "\n".join(f"- {name} (Role: {role}, Skills: {', '.join(skills)})" for (name, role, skills) in team_data)
        tasks_breakdown = "\n".join(f"[{task.task}] {task.description} - {{ {task.assigned_to} }}" for task in tasks)
        
        detailed_message = f"""
        Team Analysis:
        {team_info_str}

        Tasks Breakdown:
        {tasks_breakdown}
        """
        
        # Get messages from specific agents
        project_manager_message = None
        task_assigner_message = None
        for msg in team.groupchat.messages:
            if msg.get("name") == "ProjectManager":
                project_manager_message = msg.get("content", "")
            elif msg.get("name") == "TaskAssigner":
                task_assigner_message = msg.get("content", "")
        
        # Insert project and tasks into the database
        project_name = request.project_name  # Get project name from request
        project_description = request.project_description  # Get project description from request
        lead_id = 1  # Replace with actual lead ID
        project_id = insert_project(project_name, project_description, lead_id)
        
        for task in tasks:
            assigned_to_id = 1  # Replace with actual employee ID based on task.assigned_to
            insert_task(project_id, assigned_to_id, task.task, task.description)
        
        return ChatResponse(
            status="success",
            message=detailed_message.strip(),
            tasks=tasks,
            project_manager_message=project_manager_message,  # Include ProjectManager message
            task_assigner_message=task_assigner_message  # Include TaskAssigner message
        )
    except Exception as e:
        logging.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def main() -> None:
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()

#new changes