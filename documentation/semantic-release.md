# Semantic Release Reference

Automated versioning and changelog generation using [semantic-release](https://semantic-release.gitbook.io/) with [Conventional Commits](https://www.conventionalcommits.org/).

## Configuration

See [.releaserc.json](../.releaserc.json) for complete configuration.

### Version Bump Rules

| Commit Type | Bump | Example |
|-------------|------|---------||
| `BREAKING CHANGE` (or `!`) | Major (1.0.0 → 2.0.0) | `feat(api)!: redesign auth` |
| `feat` | Minor (1.0.0 → 1.1.0) | `feat(caelundas): add moon phases` |
| `fix`, `perf`, `refactor`, `build` | Patch (1.0.0 → 1.0.1) | `fix(lexico): resolve timeout` |
| `docs`, `test`, `ci`, `chore` | None | `docs(readme): update` |

### Changelog Sections

✨ Features • 🐛 Bug Fixes • ⚡ Performance • ♻️ Refactoring • 📦 Build • 📝 Docs • ⏪ Reverts

Hidden: `style`, `test`, `ci`, `chore`

## Usage

**Dry run** (preview without changes):

```bash
pnpm semantic-release:dry-run
```

**Manual release** (requires `GITHUB_TOKEN`):

```bash
git checkout main && git pull
pnpm semantic-release
```

**Automated** (recommended): Merging to `main` triggers [release.yml](../.github/workflows/release.yml) workflow automatically

## Examples

```bash
# Minor release (1.2.3 → 1.3.0)
feat(caelundas): add stellium detection
fix(lexico): resolve mobile layout

# Patch release (1.3.0 → 1.3.1)
fix(api): handle null values
perf(db): add index to queries

# Major release (1.3.1 → 2.0.0)
feat(api)!: redesign authentication

BREAKING CHANGE: Auth endpoints now require OAuth2

# No release
docs(readme): fix typos
test(api): add tests
fix(no-release): temporary debug  # Use no-release scope
```

## Current Configuration

**Current setup**: Fixed versioning (entire monorepo shares one version)

**NPM publishing**: Disabled (`npmPublish: false`) - packages not published to registry

**Branches**: Only `main` triggers releases

**Auto-committed files**: `CHANGELOG.md`, `package.json`, `pnpm-lock.yaml`

**Per-project releases**: Install `semantic-release-monorepo` and configure per-project `.releaserc.json` files

## Troubleshooting

| Error                | Solution                                                     |
| -------------------- | ------------------------------------------------------------ |
| Branch behind remote | `git pull origin main`                                       |
| No release published | Run `pnpm semantic-release:dry-run` to check commit analysis |
| ENOCHANGE            | No new commits since last release (normal)                   |
| EINVALIDGHTOKEN      | Set `GITHUB_TOKEN` environment variable                      |

## Best Practices

- Use conventional commits format strictly
- Test with `--dry-run` before releasing
- Never manually edit `CHANGELOG.md` or bump versions
- Squash feature branch commits into single conventional commit
- Use `BREAKING CHANGE` deliberately

## Resources

- [semantic-release docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commit guidelines](commit-messages.md)
- [Configuration](../commitlint.config.ts)
