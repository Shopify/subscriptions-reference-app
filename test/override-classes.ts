/**
We are using happy-dom to mock the dom for testing.
Happy-dom has their own implementation of the RadioNodeList window class.
Somewhere in remix-validated-form, they call: "el instanceof RadioNodeList" after we submit a form.
This check throws an error because the happy-dom version is undefined for some reason in the RVF code
So we create an override class (that's pretty simillar to the actual implementation)
for happy-dom's override so no errors are thrown
*/
export class RadioNodeListOverride extends NodeList {
  constructor(value: string = '') {
    super();
    this.value = value;
  }

  value: string;
}
