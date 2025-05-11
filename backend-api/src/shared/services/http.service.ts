import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BaseHttpService {
  constructor(private readonly _httpService: HttpService) {}

  public async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const axiosConfig: any = { ...axios.defaults, ...config };
    const result = this._httpService.get(url, axiosConfig).pipe((res) => res);

    return lastValueFrom(result);
  }

  public async post<T>(
    url: string,
    body: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const axiosConfig: any = { ...axios.defaults, ...config };
    const result = this._httpService
      .post(url, body, axiosConfig)
      .pipe((res) => res);

    return lastValueFrom(result);
  }

  public async put<T>(
    url: string,
    body: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const axiosConfig: any = { ...axios.defaults, ...config };
    const result = this._httpService
      .put(url, body, axiosConfig)
      .pipe((res) => res);

    return lastValueFrom(result);
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const axiosConfig: any = { ...axios.defaults, ...config };
    const result = this._httpService
      .delete(url, axiosConfig)
      .pipe((res) => res);

    return lastValueFrom(result);
  }

  public async request<T>(
    method: Method,
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const axiosConfig: any = { ...axios.defaults, ...config };
    const result = this._httpService
      .request({ method, url, ...axiosConfig })
      .pipe((res) => res);

    return lastValueFrom(result);
  }
}
