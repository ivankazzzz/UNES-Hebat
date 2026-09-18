import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      duration={4000}
      richColors
      closeButton
      style={{ zIndex: 99999 }}
      toastOptions={{
        style: {
          zIndex: 99999,
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-600",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
