import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Edit3, ImagePlus, Link2, Loader2, LogOut, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type ProductTag = {
  id: string;
  label: string;
  anchor: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};
type ProductFormState = {
  title: string;
  description: string;
  price: string;
  gumroad_url: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};
type TagFormState = {
  label: string;
  anchor: string;
  sort_order: number;
  is_active: boolean;
};

const emptyForm: ProductFormState = {
  title: "",
  description: "",
  price: "",
  gumroad_url: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

const emptyTagForm: TagFormState = {
  label: "",
  anchor: "",
  sort_order: 0,
  is_active: true,
};

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const toFormState = (product: Product): ProductFormState => ({
  title: product.title,
  description: product.description,
  price: product.price,
  gumroad_url: product.gumroad_url,
  image_url: product.image_url ?? "",
  sort_order: product.sort_order,
  is_active: product.is_active,
});

const toTagFormState = (tag: ProductTag): TagFormState => ({
  label: tag.label,
  anchor: tag.anchor,
  sort_order: tag.sort_order,
  is_active: tag.is_active,
});

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [tagForm, setTagForm] = useState<TagFormState>(emptyTagForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteTagTarget, setDeleteTagTarget] = useState<ProductTag | null>(null);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
    [products],
  );

  const sortedTags = useMemo(
    () => [...productTags].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    [productTags],
  );

  useEffect(() => {
    document.title = "Product Management – CareerKit Collectives";
    setMeta("robots", "noindex, nofollow");
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setCheckingSession(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Could not load products.");
    } else {
      setProducts(data ?? []);
    }
    setLoadingProducts(false);
  };

  const fetchProductTags = async () => {
    setLoadingTags(true);
    const { data, error } = await supabase
      .from("product_tags")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Could not load product tags.");
    } else {
      setProductTags((data ?? []) as ProductTag[]);
    }
    setLoadingTags(false);
  };

  useEffect(() => {
    if (session) {
      fetchProducts();
      fetchProductTags();
    }
  }, [session]);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm, sort_order: products.length + 1 });
    setSelectedFile(null);
    setPreviewUrl("");
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setForm(toFormState(product));
    setSelectedFile(null);
    setPreviewUrl(product.image_url ?? "");
    setDialogOpen(true);
  };

  const openCreateTagDialog = () => {
    setEditingTag(null);
    setTagForm({ ...emptyTagForm, sort_order: productTags.length + 1 });
    setTagDialogOpen(true);
  };

  const openEditTagDialog = (tag: ProductTag) => {
    setEditingTag(tag);
    setTagForm(toTagFormState(tag));
    setTagDialogOpen(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Upload a jpg, png, or webp image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedFile) return form.image_url || null;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, selectedFile, {
      cacheControl: "31536000",
      upsert: false,
      contentType: selectedFile.type,
    });

    if (error) throw error;

    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const imageUrl = await uploadImage();
      const payload: TablesInsert<"products"> | TablesUpdate<"products"> = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        gumroad_url: form.gumroad_url.trim(),
        image_url: imageUrl,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const request = editingProduct
        ? supabase.from("products").update(payload).eq("id", editingProduct.id)
        : supabase.from("products").insert(payload as TablesInsert<"products">);

      const { error } = await request;
      if (error) throw error;

      toast.success(editingProduct ? "Product updated." : "Product added.");
      setDialogOpen(false);
      await fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;

    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Could not delete product.");
    } else {
      toast.success("Product deleted.");
      setDeleteTarget(null);
      await fetchProducts();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Checking access…</div>;
  }

  if (!session) return <Navigate to="/admin/login" replace />;

  return (
    <main className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">CareerKit Collectives</p>
            <h1 className="mt-2 text-3xl font-bold text-primary">Product Management</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={openCreateDialog} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus aria-hidden="true" /> Add New Product
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut aria-hidden="true" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-primary">Existing Products</h2>
          </div>

          {loadingProducts ? (
            <div className="p-8 text-center text-muted-foreground">Loading products…</div>
          ) : sortedProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No products yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {sortedProducts.map((product) => (
                <article key={product.id} className="grid gap-4 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                    {product.image_url ? (
                      <img src={product.image_url} alt={`${product.title} thumbnail`} className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-primary">{product.title}</h3>
                      <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{product.price}</span>
                      <span className="rounded-sm bg-accent/10 px-2 py-1 text-xs font-medium text-primary">
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Sort order: {product.sort_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)} aria-label={`Edit ${product.title}`}>
                      <Edit3 aria-hidden="true" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(product)} aria-label={`Delete ${product.title}`}>
                      <Trash2 aria-hidden="true" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>Update the details shown on the public landing page.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="$14" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input id="sort-order" type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gumroad-url">Purchase URL</Label>
              <Input id="gumroad-url" type="url" value={form.gumroad_url} onChange={(event) => setForm({ ...form, gumroad_url: event.target.value })} required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="image-upload">Product Image</Label>
              <Input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
              {previewUrl && (
                <img src={previewUrl} alt="Selected product preview" className="h-40 w-full rounded-md border border-border object-cover" />
              )}
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <Checkbox checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked === true })} />
              Active on public site
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                Save Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.title} from the product catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Admin;
