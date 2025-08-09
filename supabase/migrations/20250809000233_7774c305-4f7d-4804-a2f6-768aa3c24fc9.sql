-- Fix RLS policies for mpesa_payments to allow customers to create payment records
-- Current policy only allows admins, but customers need to create their own payment records

-- Drop the restrictive admin-only policy for INSERT operations
DROP POLICY IF EXISTS "Admins can access payments" ON public.mpesa_payments;

-- Create new policies that allow customers to create their own payment records
-- but still keep admin oversight for updates/management

-- Allow anyone to create payment records (customers creating their payments)
CREATE POLICY "Anyone can create mpesa payments" 
ON public.mpesa_payments 
FOR INSERT 
WITH CHECK (true);

-- Allow customers to view their own payments (via order relationship)
CREATE POLICY "Users can view their own payments" 
ON public.mpesa_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = mpesa_payments.order_id 
    AND orders.user_id = auth.uid()
  )
  OR is_admin()
);

-- Only admins can update payment records (for confirmation/management)
CREATE POLICY "Admins can update mpesa payments" 
ON public.mpesa_payments 
FOR UPDATE 
USING (is_admin());

-- Only admins can delete payment records
CREATE POLICY "Admins can delete mpesa payments" 
ON public.mpesa_payments 
FOR DELETE 
USING (is_admin());

-- Fix the same issue for ncba_loop_payments table
-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Admins can access ncba payments" ON public.ncba_loop_payments;

-- Create new policies for ncba_loop_payments
-- Allow anyone to create payment records
CREATE POLICY "Anyone can create ncba loop payments" 
ON public.ncba_loop_payments 
FOR INSERT 
WITH CHECK (true);

-- Allow customers to view their own payments (via order relationship)
CREATE POLICY "Users can view their own ncba payments" 
ON public.ncba_loop_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = ncba_loop_payments.order_id 
    AND orders.user_id = auth.uid()
  )
  OR is_admin()
);

-- Only admins can update payment records
CREATE POLICY "Admins can update ncba loop payments" 
ON public.ncba_loop_payments 
FOR UPDATE 
USING (is_admin());

-- Only admins can delete payment records
CREATE POLICY "Admins can delete ncba loop payments" 
ON public.ncba_loop_payments 
FOR DELETE 
USING (is_admin());