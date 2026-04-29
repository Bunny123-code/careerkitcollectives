CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  anchor TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active product tags"
ON public.product_tags
FOR SELECT
TO anon
USING (is_active = true);

CREATE POLICY "Authenticated users can view all product tags"
ON public.product_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create product tags"
ON public.product_tags
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product tags"
ON public.product_tags
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product tags"
ON public.product_tags
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

INSERT INTO public.product_tags (label, anchor, sort_order, is_active) VALUES
  ('Resume Template', 'resume-template', 1, true),
  ('Cover Letter Template', 'cover-letter-template', 2, true),
  ('Expert Content Layer', 'expert-content-layer', 3, true),
  ('Job Application Bundle', 'job-application-bundle', 4, true),
  ('Email Templates', 'email-templates', 5, true),
  ('Complete Career Bundle', 'complete-career-bundle', 6, true);