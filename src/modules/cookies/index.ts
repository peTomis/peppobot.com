import Cookies from "universal-cookie";

export const writeCookie = (name: string, value: string, expiration?: Date) => {
  new Cookies().set(
    name,
    value,
    expiration
      ? {
          expires: expiration,
        }
      : undefined
  );
};

export const readCookie = (name: string) => new Cookies().get(name);

export const deleteCookie = (name: string) => new Cookies().remove(name);
