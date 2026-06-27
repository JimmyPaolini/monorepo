import mustache from "mustache";

/**
 * Common arguments for template-to-instance conformance validators.
 */
export interface TemplateConformanceArguments {
  data: Record<string, unknown>;
  filename: string;
  instance: string;
  template: string;
}

/**
 * Prepares rendered template and instance text for conformance validators.
 */
export function prepareConformanceTexts(args: {
  data: Record<string, unknown>;
  instance: string;
  template: string;
}): {
  instance: string;
  renderedTemplate: string;
} {
  const { data, instance, template } = args;
  return {
    instance,
    renderedTemplate: renderTemplate({ data, template }),
  };
}

/**
 * Renders a Mustache template with validator data.
 */
export function renderTemplate(args: {
  data: Record<string, unknown>;
  template: string;
}): string {
  const { data, template } = args;
  return mustache.render(template, data);
}
