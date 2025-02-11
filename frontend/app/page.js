'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/routes/axiosInstance';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isConfirmPopupOpen, setIsConfirmPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    skills: '',
  });
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [employeeProjects, setEmployeeProjects] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get('/employees');
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, []);

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);
  const toggleConfirmPopup = () => setIsConfirmPopupOpen(!isConfirmPopupOpen);
  const toggleEditPopup = () => setIsEditPopupOpen(!isEditPopupOpen);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newEmployee = {
        ...formData,
        skills: formData.skills.split(',').map((skill) => skill.trim()),
      };
      const response = await axiosInstance.post('/employees', newEmployee);
      setEmployees([...employees, response.data]);
      togglePopup();
      setFormData({ name: '', email: '', role: '', skills: '' });
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const confirmDelete = (employee) => {
    setEmployeeToDelete(employee);
    toggleConfirmPopup();
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await axiosInstance.delete(`/employees/${employeeToDelete.id}`);
      setEmployees(employees.filter((emp) => emp.id !== employeeToDelete.id));
      toggleConfirmPopup();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleEdit = (employee) => {
    setEmployeeToEdit(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      skills: employee.skills.join(', '),
    });
    toggleEditPopup();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!employeeToEdit) return;
    try {
      const updatedEmployee = {
        ...formData,
        skills: formData.skills.split(',').map((skill) => skill.trim()),
      };
      const response = await axiosInstance.put(`/employees/${employeeToEdit.id}`, updatedEmployee);
      setEmployees(employees.map((emp) => (emp.id === employeeToEdit.id ? response.data : emp)));
      toggleEditPopup();
      setFormData({ name: '', email: '', role: '', skills: '' });
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const viewTasks = async (employee) => {
    try {
      const response = await axiosInstance.get(`/employees/${employee.id}/tasks`);
      setEmployeeTasks(response.data);
      setSelectedEmployee(employee);
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
    }
  };

  const viewProjects = async (employee) => {
    try {
      const response = await axiosInstance.get(`/employees/${employee.id}/projects`);
      setEmployeeProjects(response.data);
      setSelectedEmployee(employee);
    } catch (error) {
      console.error('Error fetching employee projects:', error);
    }
  };

  return (
    <div className="p-12 bg-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold text-blue-700 mb-8">Employees</h1>
      <div className="flex justify-between mb-4">
        <button
          onClick={togglePopup}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Employee
        </button>
        <button
          onClick={() => router.push('/chat')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Create Project
        </button>
        <Link href="http://localhost:8501/">
          <p className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
            CodeGraph
          </p>
        </Link>
      </div>
      {employees.length > 0 ? (
        <ul className="space-y-4">
          {employees.map((employee, index) => (
            <li
              key={employee.id}
              className={`p-6 rounded-lg shadow-md flex justify-between items-center ${
                index % 2 === 0 ? 'bg-white' : 'bg-blue-100'
              }`}
            >
              <div>
                <div className="text-lg font-semibold text-blue-800">
                  {employee.name}
                </div>
                <div className="text-sm text-blue-600">{employee.email}</div>
                <div className="text-sm text-blue-600 mb-2">{employee.role}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {employee.skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 rounded-full text-sm bg-blue-200 text-blue-700 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleEdit(employee)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md shadow-md hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(employee)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition"
                >
                  Delete
                </button>
                {/* <button
                  onClick={() => viewTasks(employee)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
                >
                  View Tasks
                </button>
                <button
                  onClick={() => viewProjects(employee)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 transition"
                >
                  View Projects
                </button> */}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-blue-600 text-center mt-12">
          No employees found.
        </div>
      )}

      {isPopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50"
          onClick={togglePopup}
        >
          <div
            className="bg-white w-full sm:w-1/3 h-full p-6 shadow-lg transform transition-transform translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-blue-700">
              Add New Employee
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  id="role"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  id="skills"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.skills}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                  onClick={togglePopup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditPopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50"
          onClick={toggleEditPopup}
        >
          <div
            className="bg-white w-full sm:w-1/3 h-full p-6 shadow-lg transform transition-transform translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-blue-700">
              Edit Employee
            </h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  id="role"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  id="skills"
                  className="w-full px-4 py-2 border rounded-md"
                  value={formData.skills}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                  onClick={toggleEditPopup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmPopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={toggleConfirmPopup}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-blue-700 mb-4">
              Are you sure you want to delete {employeeToDelete?.name}?
            </h2>
            <div className="flex justify-end space-x-4">
              <button
                onClick={toggleConfirmPopup}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Tasks for {selectedEmployee.name}
          </h2>
          {employeeTasks.length > 0 ? (
            <ul className="space-y-4">
              {employeeTasks.map((task) => (
                <li key={task.id} className="p-4 bg-white rounded-lg shadow-md">
                  <div className="text-lg font-semibold text-blue-800">{task.title}</div>
                  <div className="text-sm text-blue-600">{task.description}</div>
                  <div className="text-sm text-blue-600">{task.status}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-blue-600">No tasks found.</div>
          )}

          <h2 className="text-2xl font-bold text-blue-700 mt-8 mb-4">
            Projects for {selectedEmployee.name}
          </h2>
          {employeeProjects.length > 0 ? (
            <ul className="space-y-4">
              {employeeProjects.map((project) => (
                <li key={project.id} className="p-4 bg-white rounded-lg shadow-md">
                  <div className="text-lg font-semibold text-blue-800">{project.name}</div>
                  <div className="text-sm text-blue-600">{project.description}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-blue-600">No projects found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;