export interface OptionValue {
  value: string;
  label: string;
}

// single data response
export interface ApiResponseType<T> {
  status: boolean;
  data: T | null;
  message: string;
  functionname: string;
}

interface ApiResponseTypeParams<T> {
  data: T | null;
  message: string;
  functionname: string;
}

export const CreateApiResponse = <T>({
  data,
  message,
  functionname,
}: ApiResponseTypeParams<T>): ApiResponseType<T> => {
  return {
    status: data !== null,
    data,
    message,
    functionname,
  };
};

// multi api response type

export interface ApiArrayResponseType<T> {
  status: boolean;
  data: T[] | null;
  skip: number;
  take: number;
  total: number;
  message: string;
  functionname: string;
}

interface CreateApiArrayResponseParams<T> {
  data: T[] | null;
  skip: number;
  take: number;
  message: string;
  total: number;
  functionname: string;
}

export const CreateApiArrayResponse = <T>({
  data,
  skip,
  take,
  message,
  total,
  functionname,
}: CreateApiArrayResponseParams<T>): ApiArrayResponseType<T> => {
  return {
    status: data !== null,
    data,
    skip,
    take,
    total,
    message,
    functionname,
  };
};
