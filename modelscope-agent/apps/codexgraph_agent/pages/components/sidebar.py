import os

import streamlit as st


def sidebar():
    with st.sidebar:
        # global page
        st.title('Code Graph Agent')
        
        api_key_input = st.text_input(
            'API Key',
            type='password',
            placeholder=
            'Paste and  API key here (sk-...)',
            value=os.environ.get('OPENAI_API_KEY', None)
            or st.session_state.get('OPENAI_API_KEY', ''),
        )
        st.markdown("""
<style>
   h1 {
      font-size: 16px;
      text-align: center;
      text-transform: uppercase;
      color: #92a8d1;
   }
</style>
""", unsafe_allow_html=True)
        st.session_state['OPENAI_API_KEY'] = api_key_input
        os.environ['OPENAI_API_KEY'] = api_key_input
        # setting()

       