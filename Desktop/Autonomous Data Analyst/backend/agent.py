import os
import pandas as pd
from langchain_groq import ChatGroq
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from pypdf import PdfReader

def get_agent(csv_path: str):
    """
    Initializes and returns a LangChain Pandas Agent with Llama-3 via Groq.
    """
    # Load the dataset based on file extension
    try:
        ext = os.path.splitext(csv_path)[1].lower()
        if ext == ".csv":
            df = pd.read_csv(csv_path)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(csv_path) 
        elif ext == ".json":
            df = pd.read_json(csv_path)
        elif ext == ".pdf":
            # Extract text from PDF
            reader = PdfReader(csv_path)
            text_data = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    text_data.append({"page": i + 1, "content": text})
            df = pd.DataFrame(text_data)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
    except Exception as e:
        raise ValueError(f"Failed to load file: {e}")

    # Initialize the LLM
    # Note: Requires GROQ_API_KEY in environment variables
    chat_model = ChatGroq(
        model_name="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    # Custom Agent Instructions
    # We prefix the prompt to enforce the plotting behavior
    custom_prefix = """
    You are an expert Data Analyst and Python programmer.
    You are working with a pandas dataframe in Python. The name of the dataframe is `df`.

    CORE INSTRUCTIONS:
    1. Answer the user's questions by writing and executing Python code.
    2. Use the `df` variable to access the data.
    3. If the user asks for a plot, chart, or graph, you MUST follow the "Visual Analyst" workflow below.

    "VISUAL ANALYST" WORKFLOW:
    - You must use the `plotly` library (express or graph_objects).
    - Create a Plotly figure (e.g. `fig = px.bar(...)`).
    - Save this figure ONLY as a JSON file to 'static/plot.json'.
    - Use data-relative paths or ensure 'static' directory exists in current context.
    - Code Example:
      ```python
      import plotly.express as px
      fig = px.bar(df, x='ColumnA', y='ColumnB')
      import os
      if not os.path.exists('static'):
          os.makedirs('static')
      fig.write_json('static/plot.json')
      ```
    - Do NOT call `fig.show()`.
    - Do NOT return the plot as image bytes.
    - After saving the JSON, your final answer should be a text summary confirming the plot generation.
    """

    # Create the Agent
    # We use ALLOW_DANGEROUS_CODE because this is a local analysis tool requested by the user.
    agent = create_pandas_dataframe_agent(
        chat_model,
        df,
        verbose=True,
        allow_dangerous_code=True,
        prefix=custom_prefix,
        agent_type="zero-shot-react-description",
    )

    return agent
