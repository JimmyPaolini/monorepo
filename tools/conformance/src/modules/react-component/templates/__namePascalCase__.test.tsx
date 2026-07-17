import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement } from 'react';
import { faker } from '@faker-js/faker';
import { {{namePascalCase}}, type {{namePascalCase}}Props } from './{{namePascalCase}}';

describe('{{namePascalCase}}', () => {
  // 🎭 Mocks
  let props: {{namePascalCase}}Props;

  // 🏗 Setup
  beforeEach(() => {
    props = {
      className: faker.string.alpha(10),
    };
  });

  // 🧪 Tests

  it('should render successfully', () => {
    const element = createElement({{namePascalCase}}, props);
    const { container } = render(element);
    expect(container).toBeInTheDocument();
  });
});
