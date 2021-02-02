import jwtDecode from 'jwt-decode';
import md5 from 'md5';
import { ActionContext, ActionTree, GetterTree, Module, MutationTree } from 'vuex';

import { API_ENDPOINT, AUTH_TOKEN } from '../../constants';
import { IRootState } from './types';

// Interfaces
export interface IUserState {
  name?: string;
  email?: string;
  birth?: string;
  secondName?: string;
  city?: string;
  sex?: string;
  items?: string[];
  interests?: string;
  id?: string;
  token?: string;
}

export interface IJWTDecoded {
  exp: number;
  id: string;
  email: string;
}

// Initial State
const state: IUserState = (() => {
  const token = localStorage.getItem(AUTH_TOKEN);

  if (token === null || token === '') {
    return {
      name: undefined,
      email: undefined,
      birth: undefined,
      secondName: undefined,
      city: undefined,
      sex: undefined,
      items: ['male', 'female', 'non binary'],
      interests: undefined,
      id: undefined,
      token: undefined,
    };
  }

  const decoded: IJWTDecoded = jwtDecode(token);

  if (decoded.exp * 1000 < Date.now().valueOf()) {
    return {
      email: undefined,
      id: undefined,
      token: undefined,
    };
  }

  return {
    email: decoded.email,
    id: decoded.id,
    token,
  };
})();

// Getters
const getters: GetterTree<IUserState, IRootState> = {
  isAuthenticated(us: IUserState): boolean {
    return !!us.token;
  },

  getAvatar(us: IUserState): string {
    const base = 'https://www.gravatar.com/avatar/';
    const query = `d=mm&r=g&s=${512}`;
    const formattedEmail = ('' + us.email).trim().toLowerCase();
    const hash = md5(formattedEmail, {encoding: 'binary'});

    return `${base}${hash}?${query}`;
  },
};

// Actions
const actions: ActionTree<IUserState, IRootState> = {
  async login({commit}: ActionContext<IUserState, IRootState>, {email, password}) {
    try {
      const response = await fetch(API_ENDPOINT + '/api/v1/auth', {
        body: JSON.stringify({
          email,
          password,
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const json = await response.json();

      if (response.status >= 200 && response.status < 300) {
        const payload: IUserState = json;
        commit('SET_USER', payload);
        commit('SET_TOKEN', payload);
      } else {
        if (json.error) {
          throw new Error(json.message);
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  },

  async signup({commit}: ActionContext<IUserState, IRootState>, {name, secondName, email, password, birth, city, sex, interests}) {
    try {
      const response = await fetch(API_ENDPOINT + '/api/v1/account', {
        body: JSON.stringify({
          name,
          secondName,
          email,
          password,
          birth,
          city,
          sex,
          interests,
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'post',
      });

      const json = await response.json();

      if (response.status >= 200 && response.status < 300) {
        const payload: IUserState = json;
        commit('SET_USER', payload);
      } else {
        if (json.error) {
          throw new Error(json.message);
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  },

  async save({commit}: ActionContext<IUserState, IRootState>, {name, secondName, email, password, birth, city, sex, interests}) {
    try {
      const response = await fetch(API_ENDPOINT + '/api/v1/account', {
        body: JSON.stringify({
          name,
          secondName,
          email,
          password,
          birth,
          city,
          sex,
          interests,
        }),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN),
          'Content-Type': 'application/json',
        },
        method: 'put',
      });

      const json = await response.json();

      if (response.status >= 200 && response.status < 300) {
        const payload: IUserState = json;
        commit('SET_USER', payload);
        commit('SET_TOKEN', payload);
      } else {
        if (json.error) {
          throw new Error(json.message);
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  },

  async get({commit}: ActionContext<IUserState, IRootState>) {
    try {
      const response = await fetch(API_ENDPOINT + '/api/v1/account', {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem(AUTH_TOKEN),
          'Content-Type': 'application/json',
        },
        method: 'get',
      });

      const json = await response.json();

      if (response.status >= 200 && response.status < 300) {
        const payload: IUserState = json;
        commit('SET_USER', payload);
      } else {
        if (json.error) {
          commit('UNSET_USER');
          throw new Error(json.message);
        }
      }
    } catch (err) {
      commit('UNSET_USER');
      throw new Error(err);
    }
  },

  logout({commit}: ActionContext<IUserState, IRootState>) {
    commit('UNSET_USER');
  },
};

// Mutations
const mutations: MutationTree<IUserState> = {
  SET_USER(us: IUserState, payload: IUserState) {
    us.email = payload.email;
    us.id = payload.id;
    us.name = payload.name;
    us.secondName = payload.secondName;
    us.birth = payload.birth;
    us.city = payload.city;
    us.sex = payload.sex;
    us.interests = payload.interests;
  },

  SET_TOKEN(us: IUserState, payload: IUserState) {
    localStorage.setItem(AUTH_TOKEN, payload.token as string);

    us.token = payload.token;
  },

  UNSET_USER(us: IUserState) {
    localStorage.removeItem(AUTH_TOKEN);

    us.email = undefined;
    us.id = undefined;
    us.name = undefined;
    us.secondName = undefined;
    us.birth = undefined;
    us.city = undefined;
    us.sex = undefined;
    us.interests = undefined;
  },
};

export const user: Module<IUserState, IRootState> = {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
