"use client";

import { useState } from "react";
import { deleteProductAction, createProductAction, parseMultimodalCatalogAction } from "@/actions/product";
import { ProductForm } from "./product-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, MoreHorizontal, Trash, Edit, Plus, Check, Sparkles, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ProductWithTypes } from "@/modules/products";

// Adaptamos el tipo para el formulario, ya convertiremos de vuelta al enviar
import { ProductFormValues } from "@/lib/schemas/product";

interface ProductsListProps {
  businessId: string;
  products: ProductWithTypes[];
}

export function ProductsList({ businessId, products }: ProductsListProps) {
  const [editingProduct, setEditingProduct] = useState<ProductWithTypes | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isMultimodalOpen, setIsMultimodalOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [catalogText, setCatalogText] = useState("");
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [isSavingParsed, setIsSavingParsed] = useState(false);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFileBase64(reader.result as string);
        toast.success(`Catálogo "${file.name}" cargado correctamente.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const mockCatalogs = [
    {
      name: "Menú de Cafetería Cafetalera",
      content: `Café Expreso - $2.50 USD: Café concentrado de grano seleccionado.
Cappuccino Clásico - $3.80 USD: Café expreso, leche espumada y un toque de cocoa.
Torta de Chocolate Fudge - $4.50 USD: Deliciosa rebanada de pastel húmedo de chocolate con fudge artesanal.
Muffin de Arándanos - $3.00 USD: Muffin horneado diariamente con arándanos silvestres orgánicos.`
    },
    {
      name: "Catálogo de Servicios de Spa & Relajación",
      content: `Masaje Relajante de 60 Minutos - $50.00 USD: Masaje corporal completo con aceites esenciales de lavanda para liberar el estrés acumulado.
Limpieza Facial Profunda - $45.00 USD: Tratamiento purificante de poros con mascarilla hidratante de algas marinas.
Piedras Calientes Terapéuticas - $70.00 USD: Terapia de calor con piedras volcánicas para descontracturar y relajar los músculos del cuerpo.`
    }
  ];

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const result = await deleteProductAction(id, businessId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  }

  async function handleScanCatalog() {
    if (!catalogText.trim() && !selectedFileBase64) {
      toast.error("Por favor ingresa texto o selecciona una imagen de catálogo.");
      return;
    }
    setIsParsing(true);
    try {
      const res = await parseMultimodalCatalogAction(catalogText, businessId, selectedFileBase64 || undefined);
      if (res.success && res.products) {
        setParsedProducts(res.products);
        toast.success(`¡Se han extraído ${res.products.length} productos con éxito! Revisa los detalles antes de digitalizarlos.`);
      } else {
        toast.error(res.error || "No se pudo extraer productos del catálogo.");
      }
    } catch (e) {
      toast.error("Error al procesar la solicitud con IA.");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSaveParsedProducts() {
    if (parsedProducts.length === 0) return;
    setIsSavingParsed(true);
    try {
      let savedCount = 0;
      for (const prod of parsedProducts) {
        const res = await createProductAction(businessId, {
          name: prod.name,
          description: prod.description,
          shortDesc: prod.description.substring(0, 100),
          imageUrl: "",
          features: prod.features.map((f: string) => ({ name: f, description: "" })),
          benefits: [],
          pricing: {
            basePrice: prod.basePrice,
            currency: prod.currency,
            period: "one-time"
          },
          keywords: prod.features.join(", "),
          isActive: true
        });
        if (res.success) {
          savedCount++;
        }
      }
      toast.success(`¡Se han digitalizado ${savedCount} de ${parsedProducts.length} productos con éxito!`);
      setIsMultimodalOpen(false);
      setCatalogText("");
      setParsedProducts([]);
      window.location.reload();
    } catch (e) {
      toast.error("Ocurrió un error inesperado al guardar los productos.");
    } finally {
      setIsSavingParsed(false);
    }
  }

  // Helper para convertir el tipo de Prisma al tipo del formulario
  const mapProductToForm = (product: ProductWithTypes): ProductFormValues & { id: string } => {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc || undefined,
      imageUrl: product.images && (product.images as string[]).length > 0 ? (product.images as string[])[0] : "",
      features: product.features.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        icon: f.icon
      })),
      benefits: product.benefits.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        forPersona: b.forPersona
      })),
      pricing: product.pricing ? {
        currency: product.pricing.currency,
        basePrice: product.pricing.basePrice,
        discountPrice: product.pricing.discountPrice,
        period: product.pricing.period
      } : undefined,
      keywords: product.keywords ? (product.keywords as string[]).join(", ") : "",
      isActive: product.isActive
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Inventario de Productos</h3>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsMultimodalOpen(true)}
            className="border-dashed border-violet-250 bg-violet-50/50 text-violet-750 hover:bg-violet-100/80 gap-1.5 font-bold text-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            Digitalizar Catálogo (IA)
          </Button>
          <Button onClick={() => {
            setEditingProduct(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-lg bg-muted/20 border-dashed p-8 text-center">
          <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay productos registrados</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Los productos son la base para que la IA genere contenido relevante. Agrega tu primer producto.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Crear Producto
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const hasImage = product.images && (product.images as string[]).length > 0;
            const imageUrl = hasImage ? (product.images as string[])[0] : null;

            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all duration-350 group flex flex-col justify-between">
                <div>
                  <div className="h-32 bg-muted relative overflow-hidden flex items-center justify-center border-b">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="p-3 rounded-full bg-background/60 shadow-sm">
                        <Package className="h-6 w-6 text-muted-foreground/45 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {product.isActive ? (
                        <Badge className="text-[9px] h-5 bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 font-bold">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-5 text-muted-foreground bg-background font-bold">Inactivo</Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate" title={product.name}>
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {product.pricing && (
                          <span className="text-xs font-semibold text-blue-600">
                            {product.pricing.basePrice} {product.pricing.currency} {product.pricing.period && product.pricing.period !== 'one-time' ? `/ ${product.pricing.period}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setEditingProduct(product);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[50px] leading-relaxed">
                      {product.shortDesc || product.description}
                    </p>
                  </CardContent>
                </div>
                <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-muted/10 mt-2 bg-muted/5">
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/90 font-medium">
                    <div className="flex items-center gap-1" title="Características">
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      {product.features.length} Features
                    </div>
                    <div className="flex items-center gap-1" title="Beneficios">
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      {product.benefits.length} Beneficios
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingProduct(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              Configura los detalles del producto para la generación de contenido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
             <ProductForm 
                businessId={businessId}
                defaultValues={editingProduct ? mapProductToForm(editingProduct) : undefined} 
                onSuccess={() => setIsDialogOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DIGITALIZAR CATALOGO (IA MULTIMODAL) */}
      <Dialog open={isMultimodalOpen} onOpenChange={setIsMultimodalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              Digitalización Multimodal de Catálogo con IA
            </DialogTitle>
            <DialogDescription>
              Carga una imagen de tu menú, un folleto de servicios o pega el texto plano de tu catálogo para extraer los productos al instante.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 p-1">
            {parsedProducts.length === 0 ? (
              <div className="space-y-4">
                {/* Drag-and-drop Area / Real File Upload */}
                <label className="border-2 border-dashed border-muted rounded-xl p-8 text-center bg-muted/5 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-muted/10 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-sm">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {fileName ? `Archivo seleccionado: ${fileName}` : "Arrastra tu Catálogo o Haz clic para subir"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Compatible con formatos PNG, JPG, JPEG.</p>
                  </div>
                </label>

                {/* Predefined mock catalog selection */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">O usa un ejemplo rápido para probar:</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mockCatalogs.map((cat, idx) => (
                      <Card 
                        key={idx} 
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer border border-muted/50 transition-colors"
                        onClick={() => {
                          setCatalogText(cat.content);
                          toast.success(`Cargado ejemplo: ${cat.name}`);
                        }}
                      >
                        <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
                          <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          {cat.name}
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                          "{cat.content.substring(0, 100)}..."
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Texto o Contenido del Catálogo
                  </label>
                  <Textarea
                    placeholder="Pega aquí los nombres, precios y descripciones de tus productos o el texto extraído del archivo..."
                    value={catalogText}
                    onChange={(e: any) => setCatalogText(e.target.value)}
                    className="min-h-[140px] text-xs leading-relaxed"
                  />
                </div>

                <Button
                  onClick={handleScanCatalog}
                  disabled={isParsing || (!catalogText.trim() && !selectedFileBase64)}
                  className="w-full text-xs font-semibold h-10 bg-violet-650 hover:bg-violet-700 text-white gap-1.5"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando e Identificando productos con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      Digitalizar Contenido con IA
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // TABLA DE PREVISUALIZACION DE PRODUCTOS EXTRAIDOS
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-violet-700">Productos identificados ({parsedProducts.length})</span>
                  <Button variant="ghost" size="sm" onClick={() => setParsedProducts([])} className="text-xs text-muted-foreground hover:text-foreground h-8 font-semibold">
                    ← Volver a Escanear
                  </Button>
                </div>
                <div className="space-y-3">
                  {parsedProducts.map((prod, idx) => (
                    <Card key={idx} className="p-4 border border-muted/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <Input
                            value={prod.name}
                            onChange={(e: any) => {
                              const updated = [...parsedProducts];
                              updated[idx].name = e.target.value;
                              setParsedProducts(updated);
                            }}
                            className="font-bold text-xs h-8"
                          />
                          <Textarea
                            value={prod.description}
                            onChange={(e: any) => {
                              const updated = [...parsedProducts];
                              updated[idx].description = e.target.value;
                              setParsedProducts(updated);
                            }}
                            className="text-xs min-h-[60px] leading-relaxed resize-none mt-1"
                          />
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0 w-36">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Precio</span>
                            <Input
                              type="number"
                              value={prod.basePrice}
                              onChange={(e: any) => {
                                const updated = [...parsedProducts];
                                updated[idx].basePrice = parseFloat(e.target.value) || 0;
                                setParsedProducts(updated);
                              }}
                              className="text-xs h-8 font-semibold"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Moneda</span>
                            <Input
                              value={prod.currency}
                              onChange={(e: any) => {
                                const updated = [...parsedProducts];
                                updated[idx].currency = e.target.value;
                                setParsedProducts(updated);
                              }}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {prod.features?.map((feat: string, fIdx: number) => (
                          <Badge key={fIdx} variant="secondary" className="text-[9px] font-bold bg-muted/60 text-foreground">
                            {feat}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  onClick={handleSaveParsedProducts}
                  disabled={isSavingParsed}
                  className="w-full text-xs font-semibold h-10 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                >
                  {isSavingParsed ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando productos en inventario...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar e Insertar {parsedProducts.length} Productos
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
