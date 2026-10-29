type BackHandler = () => boolean;

let handler: BackHandler | null = null;

export const setAndroidBackHandler = (next: BackHandler | null) => {
  handler = next;
};

export const runAndroidBackHandler = () => (handler ? handler() : false);
