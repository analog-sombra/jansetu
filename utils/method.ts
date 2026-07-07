import { FieldErrors, FieldValues } from "react-hook-form";

export const onFormError = <T extends FieldValues>(error: FieldErrors<T>) => {
  const firstErrorMessage = Object.values(error)[0]?.message;

  setTimeout(() => {
    if (firstErrorMessage) {
      const errorElement = Array.from(document.querySelectorAll("p")).find(
        (el) => el.textContent == firstErrorMessage,
      );
      if (errorElement) {
        // Scroll to the error message element
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "start",
        });
      }
    }
  }, 1000);
};

const capitalcase = (value: string): string => {
  const words = value.split(" ");

  const capitalWords = words.map((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  return capitalWords.join(" ");
};

export { capitalcase };
