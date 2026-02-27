import { fetchUtils, DataProvider } from "react-admin";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  return fetchUtils.fetchJson(url, { ...options, headers });
};

// Map react-admin resource names to API endpoints
const resourceMap: Record<string, string> = {
  "vehicle-types": "vehicle-types",
  processes: "processes",
  operations: "operations",
  "production-standards": "production-standards",
  "production-orders": "production-orders",
  registrations: "registrations/admin/all",
  users: "auth/users",
};

const getResourceUrl = (resource: string) => {
  return `${API_URL}/${resourceMap[resource] || resource}`;
};

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: "id", order: "ASC" };

    const query: Record<string, string> = {
      _page: String(page),
      _limit: String(perPage),
      _sort: field,
      _order: order,
    };

    // Add filters
    if (params.filter) {
      Object.keys(params.filter).forEach((key) => {
        query[key] = params.filter[key];
      });
    }

    const queryString = new URLSearchParams(query).toString();
    const url = `${getResourceUrl(resource)}?${queryString}`;

    const { json } = await httpClient(url);

    return {
      data:
        json.data?.map((item: any) => ({ ...item, id: item._id || item.id })) ||
        [],
      total: json.count || json.data?.length || 0,
    };
  },

  getOne: async (resource, params) => {
    const url = `${getResourceUrl(resource)}/${params.id}`;
    const { json } = await httpClient(url);

    return {
      data: { ...json.data, id: json.data._id || json.data.id },
    };
  },

  getMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) => httpClient(`${getResourceUrl(resource)}/${id}`)),
    );

    return {
      data: responses.map(({ json }) => ({
        ...json.data,
        id: json.data._id || json.data.id,
      })),
    };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const query: Record<string, string> = {
      [params.target]: String(params.id),
      _page: String(page),
      _limit: String(perPage),
      _sort: field,
      _order: order,
    };

    const queryString = new URLSearchParams(query).toString();
    const url = `${getResourceUrl(resource)}?${queryString}`;

    const { json } = await httpClient(url);

    return {
      data:
        json.data?.map((item: any) => ({ ...item, id: item._id || item.id })) ||
        [],
      total: json.count || json.data?.length || 0,
    };
  },

  create: async (resource, params) => {
    const url = getResourceUrl(resource).replace("/admin/all", "");
    const { json } = await httpClient(url, {
      method: "POST",
      body: JSON.stringify(params.data),
    });

    return {
      data: { ...json.data, id: json.data._id || json.data.id },
    };
  },

  update: async (resource, params) => {
    const baseUrl = getResourceUrl(resource).replace("/admin/all", "");
    const url = `${baseUrl}/${params.id}`;
    const { json } = await httpClient(url, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });

    return {
      data: { ...json.data, id: json.data._id || json.data.id },
    };
  },

  updateMany: async (resource, params) => {
    const baseUrl = getResourceUrl(resource).replace("/admin/all", "");
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(`${baseUrl}/${id}`, {
          method: "PUT",
          body: JSON.stringify(params.data),
        }),
      ),
    );

    return { data: params.ids };
  },

  delete: async (resource, params) => {
    const baseUrl = getResourceUrl(resource).replace("/admin/all", "");
    const url = `${baseUrl}/${params.id}`;
    const { json } = await httpClient(url, {
      method: "DELETE",
    });

    return { data: { id: params.id } as any };
  },

  deleteMany: async (resource, params) => {
    const baseUrl = getResourceUrl(resource).replace("/admin/all", "");
    await Promise.all(
      params.ids.map((id) =>
        httpClient(`${baseUrl}/${id}`, {
          method: "DELETE",
        }),
      ),
    );

    return { data: params.ids };
  },
};

export default dataProvider;
