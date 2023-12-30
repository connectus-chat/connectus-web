export function getFormData(form: HTMLFormElement) {
  const formData = new FormData(form);
  const data: { [key: string]: string } = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value.toString();
  }
  return data;
}
