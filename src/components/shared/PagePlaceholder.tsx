// Stand-in for screens that haven't been built yet.
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="type-2">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
