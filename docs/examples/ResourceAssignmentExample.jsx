import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Context de autenticación

const ResourceAssignmentExample = ({ projectId }) => {
    const { token } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [assignmentResult, setAssignmentResult] = useState(null);
    const [projectAssignment, setProjectAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configuración del cliente Axios
    const api = axios.create({
        baseURL: 'http://localhost:3000/api',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // Cargar tareas del proyecto
    useEffect(() => {
        if (!projectId) return;

        const fetchTasks = async () => {
            try {
                // Suponemos que hay un endpoint para obtener las tareas del proyecto
                const response = await api.get(`/projects/${projectId}/tasks`);
                setTasks(response.data.data);
            } catch (error) {
                console.error('Error al cargar tareas:', error);
                setError('No se pudieron cargar las tareas del proyecto.');
            }
        };

        fetchTasks();
    }, [projectId]);

    // Asignar recursos a una tarea específica
    const assignResourceToTask = async () => {
        if (!selectedTask) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/resources/assign/${selectedTask}`);
            setAssignmentResult(response.data.data);
            setProjectAssignment(null);
        } catch (error) {
            console.error('Error al asignar recursos:', error);
            setError('Error al asignar recursos a la tarea.');
        } finally {
            setLoading(false);
        }
    };

    // Asignar recursos a todo el proyecto
    const assignResourceToProject = async () => {
        if (!projectId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/resources/assign/project/${projectId}`);
            setProjectAssignment(response.data.data);
            setAssignmentResult(null);
        } catch (error) {
            console.error('Error al asignar recursos al proyecto:', error);
            setError('Error al asignar recursos al proyecto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="resource-assignment-container">
            <h2>Asignación de Recursos con IA</h2>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="card">
                <div className="card-body">
                    <h3>Asignar recursos a una tarea específica</h3>

                    <div className="form-group">
                        <label>Selecciona una tarea:</label>
                        <select
                            value={selectedTask || ''}
                            onChange={(e) => setSelectedTask(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Selecciona una tarea --</option>
                            {tasks.map((task) => (
                                <option key={task.id} value={task.id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={assignResourceToTask}
                        disabled={loading || !selectedTask}
                        className="button primary"
                    >
                        {loading ? 'Asignando...' : 'Asignar recurso a tarea'}
                    </button>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-body">
                    <h3>Asignar recursos a todo el proyecto</h3>
                    <p>Asigna recursos óptimos a todas las tareas del proyecto de forma inteligente.</p>

                    <button
                        onClick={assignResourceToProject}
                        disabled={loading || !projectId}
                        className="button secondary"
                    >
                        {loading ? 'Asignando...' : 'Asignar recursos al proyecto'}
                    </button>
                </div>
            </div>

            {/* Resultados de asignación de tarea */}
            {assignmentResult && (
                <div className="results-card">
                    <h3>Resultado de asignación para: {assignmentResult.tarea}</h3>

                    <div className="assigned-resource">
                        <div className="resource-header">
                            <h4>{assignmentResult.recurso_asignado.desarrollador}</h4>
                            <span className="badge">{assignmentResult.recurso_asignado.nivel}</span>
                        </div>

                        <div className="resource-details">
                            <p>
                                <strong>Tecnología principal:</strong> {assignmentResult.recurso_asignado.tecnología}
                            </p>

                            <div className="tools-section">
                                <p>
                                    <strong>Herramientas:</strong>
                                </p>
                                <div className="tags">
                                    {assignmentResult.recurso_asignado.herramientas.map((tool, index) => (
                                        <span key={index} className="tag">
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resultados de asignación de proyecto */}
            {projectAssignment && (
                <div className="results-card">
                    <h3>Asignación para proyecto: {projectAssignment.proyecto}</h3>

                    <div className="team-section">
                        <h4>Equipo sugerido:</h4>
                        <div className="member-list">
                            {projectAssignment.equipo_sugerido.map((member, index) => (
                                <div key={index} className="team-member">
                                    {member}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="assignments-section">
                        <h4>Asignaciones por miembro:</h4>
                        <table className="assignments-table">
                            <thead>
                                <tr>
                                    <th>Desarrollador</th>
                                    <th>Tarea Asignada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(projectAssignment.tareas_asignadas).map(([dev, task], index) => (
                                    <tr key={index}>
                                        <td>{dev}</td>
                                        <td>{task}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceAssignmentExample;
