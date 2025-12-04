// Utilities
export { cn } from "./lib/utils";

// Hooks
export {
  useMediaQuery,
  useBreakpoint,
  breakpoints,
} from "./hooks/use-media-query";

// UI Components
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
export { Input } from "./components/ui/input";
export { Label } from "./components/ui/label";
export { Separator } from "./components/ui/separator";
export { Textarea } from "./components/ui/textarea";

// Entry Components
export {
  AdjectiveFormsTable,
  type AdjectiveForm,
  type AdjectiveFormsTableProps,
  EntryCard,
  type EntryCardProps,
  FormCell,
  type FormCellProps,
  type FormCellPosition,
  FormTabs,
  type FormTabsProps,
  Forms,
  type FormsProps,
  type FormsData,
  FormsTable,
  type FormsTableProps,
  Identifier,
  type IdentifierProps,
  abbreviations,
  identifierStyles,
  NounFormsTable,
  type NounForm,
  type NounFormsTableProps,
  PrincipalParts,
  type PrincipalPartsProps,
  type PrincipalPart,
  type PartOfSpeech,
  type Inflection,
  type NounInflection,
  type VerbInflection,
  type AdjectiveInflection,
  type AdverbInflection,
  type PrepositionInflection,
  type Uninflected,
  getInflectionLabel,
  getPrincipalPartsLabel,
  Translations,
  type TranslationsProps,
  VerbFormsTable,
  type VerbForm,
  type VerbFormsTableProps,
} from "./components/entry";

// Layout Components
export {
  Deck,
  type DeckProps,
  Layout,
  type LayoutProps,
  Logo,
  type LogoProps,
  Navigation,
  defaultNavItems,
  type NavigationProps,
  type NavItem,
  SearchBar,
  type SearchBarProps,
} from "./components/layout";
