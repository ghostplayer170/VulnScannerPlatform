import { useState } from 'react';
import '../styles/IssueSolutionModal.css';

// Componente para mostrar la solución de un problema en un modal
function IssueSolutionModal({ issue }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="open-solution-btn">
                Ver guía
            </button>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                        <h3>Guía para la regla: {issue.rule}</h3>
                        <div
                            className="solution-html"
                            dangerouslySetInnerHTML={{ __html: issue.solutionHtml }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default IssueSolutionModal;
