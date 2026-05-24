import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement } from 'react';
import { faker } from '@faker-js/faker';
import { {{namePascal}}, type {{namePascal}}Props } from './{{namePascal}}';

describe('{{namePascal}}', () => {
  // 🎭 Mocks
  let props: {{namePascal}}Props;

  // 🏗️ Setup
  beforeEach(() => {
    props = {
      className: faker.helpers.arrayElement([undefined, faker.string.alpha(10)]),
    };
  });

  // 🧪 Tests

  it('should render successfully', () => {
    const element = createElement({{namePascal}}, props);
    const { container } = render(element);
    expect(container).toBeInTheDocument();
  });
});
