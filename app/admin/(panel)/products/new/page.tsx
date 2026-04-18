import { createProduct } from '../actions';
import ProductForm from '../ProductForm';

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-[#16234d]">Nuevo producto</h1>
        <p className="text-slate-500 text-sm mt-1">Completa los campos para agregar un producto.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <ProductForm action={createProduct} submitLabel="Crear producto" />
      </div>
    </div>
  );
}
