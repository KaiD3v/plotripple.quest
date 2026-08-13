export function NarrativeOption({
  id,
  name,
  value,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`narrative-plate${checked ? " is-selected" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        className="sr-only"
        onChange={() => onChange(value)}
      />
      <span className="narrative-plate-mark" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
