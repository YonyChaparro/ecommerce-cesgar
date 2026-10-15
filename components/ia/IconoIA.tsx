// La estrella de cuatro puntas del asistente: el único ícono que no sale de
// lucide-react (propuesta §6.1, regla 7).
export default function IconoIA({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2c.4 0 .7.3.8.6l1.3 4.6c.4 1.4 1.4 2.4 2.8 2.8l4.6 1.3c.4.1.6.4.6.8s-.3.7-.6.8l-4.6 1.3c-1.4.4-2.4 1.4-2.8 2.8l-1.3 4.6c-.1.4-.4.6-.8.6s-.7-.3-.8-.6l-1.3-4.6c-.4-1.4-1.4-2.4-2.8-2.8l-4.6-1.3c-.4-.1-.6-.4-.6-.8s.3-.7.6-.8l4.6-1.3c1.4-.4 2.4-1.4 2.8-2.8l1.3-4.6c.1-.4.4-.6.8-.6Z" />
    </svg>
  );
}
