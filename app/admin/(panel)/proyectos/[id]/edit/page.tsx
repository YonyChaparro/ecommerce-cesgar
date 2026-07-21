import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProjectForm from '../../ProjectForm';
import { updateProject } from '../../actions';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!project) notFound();

  const action = updateProject.bind(null, id);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-headline font-bold text-inverse-surface">Editar proyecto</h1>
        <p className="text-slate-500 text-sm mt-1 truncate max-w-xl">{project.title}</p>
      </div>
      <ProjectForm action={action} project={project} submitLabel="Guardar cambios" />
    </div>
  );
}
