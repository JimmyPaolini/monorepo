import { ReactElement } from "react";

// 🔖 Type
export interface {{namePascalCase}}Props {
  className?: string;
}

// 🧩 Component
export const {{namePascalCase}} = (props: {{namePascalCase}}Props): ReactElement => {
  const { className } = props;

  // 🪝 Hooks

  // 🏗️ Setup

  // 💪 Handler

  // 🎨 Markup

  // ♻️ Lifecycle

  // 🔌 Short Circuits

  return (
    <div className={className}>
      {{namePascalCase}} component
    </div>
  );
};
