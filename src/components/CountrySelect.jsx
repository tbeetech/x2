import { useId } from "react";
import { COUNTRIES } from "../data/countries.js";

function normalize(value) {
  return value?.trim() ?? "";
}

function getOptionLabel(country) {
  return `${country.name} (${country.code})`;
}

export function CountrySelect({ value, onChange, required = false, className = "", placeholder = "Select country" }) {
  const listId = useId();
  const normalized = normalize(value);

  const handleChange = (event) => {
    const nextValue = normalize(event.target.value);
    onChange?.(nextValue);
  };

  return (
    <>
      <input
        required={required}
        value={normalized}
        onChange={handleChange}
        list={listId}
        placeholder={placeholder}
        autoComplete="country-name"
        className={className}
      />
      <datalist id={listId}>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.name}>
            {getOptionLabel(country)}
          </option>
        ))}
      </datalist>
    </>
  );
}

