import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

function CodeEditor({ code, setCode, handleAnalyze, loading }) {
  return (
    <div className="code-panel">
      <h2>Código a analizar</h2>
      <CodeMirror
        value={code}
        height="400px"
        extensions={[javascript()]}
        onChange={(value) => setCode(value)}
        className="code-editor"
      />
      <button 
        onClick={handleAnalyze} 
        disabled={loading} 
        className="analyze-button"
      >
        {loading ? 'Analizando...' : 'Analizar Código'}
      </button>
    </div>
  );
}

export default CodeEditor;