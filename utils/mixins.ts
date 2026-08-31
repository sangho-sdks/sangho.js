// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pattern mixin officiel TS : les constructeurs mixés ont des signatures hétérogènes, unknown[] casse l'appel spread ci-dessous.
type Constructor<T = object> = new (...args: any[]) => T;

export function Mixins<TBase extends Constructor>(BaseClass: TBase, ...Bases: Constructor[]) {
  class MixinsClass extends BaseClass {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- même raison : args passés tel quel aux constructeurs de Bases.
    constructor(...args: any[]) {
      super(...args);
      Bases.forEach((Base) => {
        const instance = new Base(...args);
        Object.getOwnPropertyNames(instance).forEach((name) => {
          if (name !== 'constructor') {
            const descriptor = Object.getOwnPropertyDescriptor(instance, name);
            if (descriptor) {
              Object.defineProperty(this, name, descriptor);
            }
          }
        });
        
        // Copier les méthodes du prototype
        const proto = Base.prototype;
        Object.getOwnPropertyNames(proto).forEach((name) => {
          if (name !== 'constructor') {
            const descriptor = Object.getOwnPropertyDescriptor(proto, name);
            if (descriptor) {
              Object.defineProperty(MixinsClass.prototype, name, descriptor);
            }
          }
        });
      });
    }
  }

  return MixinsClass;
}