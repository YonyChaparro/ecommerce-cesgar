import ProjectForm from '../ProjectForm';
import { createProject } from '../actions';

export default function NewProjectPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-headline font-bold text-inverse-surface">Nuevo proyecto</h1>
        <p className="text-slate-500 text-sm mt-1">Crea un nuevo proyecto para publicar</p>
      </div>
      <ProjectForm action={createProject} submitLabel="Publicar proyecto" />
    </div>
  );
}
