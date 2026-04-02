
-- Allow squad members to flag messages (update is_flagged)
CREATE POLICY "Squad members can flag messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM squad_memberships
    WHERE squad_memberships.squad_id = messages.squad_id
    AND squad_memberships.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM squad_memberships
    WHERE squad_memberships.squad_id = messages.squad_id
    AND squad_memberships.user_id = auth.uid()
  )
);

-- Allow admins to delete flagged messages
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
