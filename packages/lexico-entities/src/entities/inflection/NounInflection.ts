export type NounDeclension = 'first' | 'second' | 'third' | 'fourth' | 'fifth' | '';
export type NounGender = 'masculine' | 'feminine' | 'masc/fem' | 'neuter' | '';

export class NounInflection {
  declension: NounDeclension = '';
  gender: NounGender = '';
  other?: string = '';

  constructor(declension: NounDeclension = '', gender: NounGender = '', other = '') {
    this.declension = declension;
    this.gender = gender;
    this.other = other;
  }
}
