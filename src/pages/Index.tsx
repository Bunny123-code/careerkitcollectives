import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, ExternalLink, FileText, Layers3, Mail, PackageCheck, Sparkles } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const brandName = "CareerKit Collectives";
type Product = Tables<"products">;
type ProductTag = {
  id: string;
  label: string;
  anchor: string;
  sort_order: number;
  is_active: boolean;
};

const productIcons = [FileText, Mail, Layers3, BriefcaseBusiness, Mail, PackageCheck];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getProductCategory = (product: Product) => {
  const title = product.title.toLowerCase();

  if (title.includes("bundle") || title.includes("kit")) return { label: "Bundles", value: "bundles" };
  if (title.includes("resume")) return { label: "Resumes", value: "resumes" };
  if (title.includes("cover")) return { label: "Cover Letters", value: "cover-letters" };
  if (title.includes("expert") || title.includes("content")) return { label: "Expert Content", value: "expert-content" };
  if (title.includes("email")) return { label: "Email Templates", value: "email-templates" };

  return { label: "Templates", value: "templates" };
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

const ProductThumbnail = ({ product, index }: { product: Product; index: number }) => {
  const Icon = productIcons[index % productIcons.length];

  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={`${product.title} thumbnail`}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-secondary">
      <div className="absolute inset-x-8 top-8 h-px bg-border" />
      <div className="absolute bottom-8 left-8 right-8 h-px bg-border" />
      <div className="relative w-28 max-w-[70%] border border-border bg-card p-4 shadow-document">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
          <span className="h-2 w-10 bg-accent/40" />
        </div>
        <span className="mb-2 block h-2 w-full bg-primary/20" />
        <span className="mb-2 block h-2 w-5/6 bg-primary/15" />
        <span className="block h-2 w-2/3 bg-primary/10" />
      </div>
    </div>
  );
};

const ProductCard = ({ product, index, isHighlighted }: { product: Product; index: number; isHighlighted: boolean }) => {
  const category = getProductCategory(product);

  return (
    <article
      id={slugify(product.title)}
      data-category={category.value}
      className={`group scroll-mt-28 flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-elevated ${
        isHighlighted ? "border-accent shadow-elevated animate-product-glow" : "border-border"
      }`}
    >
    <div className="aspect-[4/3] overflow-hidden border-b border-border">
      <ProductThumbnail product={product} index={index} />
    </div>
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <h3 className="min-h-12 text-base font-semibold leading-snug text-foreground sm:text-lg">{product.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {product.description.length > 100 ? `${product.description.slice(0, 100).trim()}…` : product.description}
      </p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-primary">{product.price}</span>
        <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <a href={product.gumroad_url} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${product.title}`}>
            Buy Now <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </div>
    </div>
    </article>
  );
};

const Index = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [highlightedProduct, setHighlightedProduct] = useState("");

  const categories = useMemo(
    () =>
      Array.from(new Map(products.map((product) => {
        const category = getProductCategory(product);
        return [category.value, category];
      })).values()),
    [products],
  );

  const visibleProducts = useMemo(
    () => (activeFilter === "all" ? products : products.filter((product) => getProductCategory(product).value === activeFilter)),
    [activeFilter, products],
  );

  const sortedProductTags = useMemo(
    () => [...productTags].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    [productTags],
  );

  useEffect(() => {
    document.title = "Career Templates – Professional Resume & Cover Letter Downloads";
    setMeta(
      "description",
      "Premium editable resume, cover letter, expert content, email, and career bundle templates from CareerKit Collectives.",
    );
    setMeta("robots", "index, follow");
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      const [{ data, error: fetchError }, { data: tagData }] = await Promise.all([
        supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        (supabase as any)
          .from("product_tags")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (fetchError) {
        setError("Templates are temporarily unavailable. Please refresh in a moment.");
      } else {
        setProducts(data ?? []);
        setProductTags((tagData ?? []) as ProductTag[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (loading || products.length === 0 || !location.hash) return;

    const targetId = decodeURIComponent(location.hash.slice(1));
    setActiveFilter("all");
    setHighlightedProduct(targetId);

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const timeout = window.setTimeout(() => setHighlightedProduct(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [loading, location.hash, products]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a href="#top" className="flex min-w-0 items-center gap-3 font-semibold text-primary">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm sm:text-base">{brandName}</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#products" className="text-sm font-medium text-muted-foreground transition hover:text-primary">
              Products
            </a>
            {session && (
              <Link to="/admin" className="text-sm font-medium text-muted-foreground transition hover:text-primary">
                Admin
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-editorial-lines" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-28">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-xs font-semibold uppercase tracking-widest text-primary shadow-soft">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                Editable digital career tools
              </div>
              <h1 className="text-balance text-4xl font-bold leading-tight text-primary sm:text-5xl lg:text-6xl">
                Premium Career Templates – Land Your Next Role with Confidence
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Professionally designed resume, cover letter, expert content layer, and email templates. Editable, instant download – no design skills needed.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="#products">Explore Templates</a>
                </Button>
                <span className="text-sm font-medium text-muted-foreground">Minimal files. Premium structure. Immediate clarity.</span>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
              <div className="relative aspect-[4/3] w-full max-w-lg border border-border bg-card shadow-elevated">
                <div className="absolute left-8 top-8 h-56 w-40 rotate-[-8deg] border border-border bg-background p-5 shadow-document">
                  <FileText className="mb-6 h-8 w-8 text-accent" aria-hidden="true" />
                  <span className="mb-3 block h-2 w-full bg-primary/25" />
                  <span className="mb-3 block h-2 w-4/5 bg-primary/15" />
                  <span className="mb-8 block h-2 w-3/5 bg-primary/10" />
                  <span className="block h-12 border-l-2 border-accent bg-secondary" />
                </div>
                <div className="absolute bottom-10 right-8 h-64 w-44 rotate-[6deg] border border-border bg-background p-5 shadow-document">
                  <Layers3 className="mb-6 h-8 w-8 text-accent" aria-hidden="true" />
                  <span className="mb-3 block h-2 w-5/6 bg-primary/25" />
                  <span className="mb-3 block h-2 w-full bg-primary/15" />
                  <span className="mb-8 block h-2 w-2/3 bg-primary/10" />
                  <span className="block h-16 border border-border bg-secondary" />
                </div>
                <div className="absolute bottom-8 left-1/2 h-16 w-36 -translate-x-1/2 border border-accent/50 bg-accent/10 p-4 shadow-soft">
                  <span className="block h-2 w-full bg-accent/70" />
                  <span className="mt-3 block h-2 w-2/3 bg-accent/40" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Digital downloads</p>
              <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">Our Templates</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Build a sharper application system with editable documents, polished language, and matching career materials.
            </p>
          </div>

          {loading && <p className="py-12 text-center text-muted-foreground">Loading templates…</p>}
          {error && !loading && <p className="py-12 text-center text-destructive">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No templates are available right now.</p>
          )}
          {!loading && !error && products.length > 0 && (
            <>
              <div className="mb-8 flex gap-2 overflow-x-auto pb-2" aria-label="Filter templates by category">
                {[{ label: "All", value: "all" }, ...categories].map((category) => {
                  const isActive = activeFilter === category.value;
                  return (
                    <Button
                      key={category.value}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveFilter(category.value)}
                      className={`shrink-0 ${isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card"}`}
                      aria-pressed={isActive}
                    >
                      {category.label}
                    </Button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {visibleProducts.map((product, index) => {
                  const slug = slugify(product.title);
                  return <ProductCard key={product.id} product={product} index={index} isHighlighted={highlightedProduct === slug} />;
                })}
              </div>
            </>
          )}
        </section>

        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              [CheckCircle2, "Editable & ATS-Friendly"],
              [PackageCheck, "Instant Digital Download"],
              [Layers3, "Matching Bundle Sets"],
            ].map(([Icon, label]) => {
              const TrustIcon = Icon as typeof CheckCircle2;
              return (
                <div key={label as string} className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-background text-accent shadow-soft">
                    <TrustIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="font-semibold text-primary">{label as string}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="bg-primary px-4 py-10 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <p>Templates by {brandName}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
