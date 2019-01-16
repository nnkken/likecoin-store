/* eslint import/prefer-default-export: "off" */
import * as types from '@/store/mutation-types';
import * as api from '@/util/api/api';
import { WALLET_NOTICE_EXPIRY_INTERVAL } from '@/constant';
import apiWrapper from './api-wrapper';

export const setLocale = ({ commit }, locale) => {
  commit(types.UI_SET_LOCALE, locale);
  commit(types.UI_CLOSE_SLIDING_MENU);
};

export const setMetamaskError = ({ commit }, msg) => {
  commit(types.UI_SET_METAMASK_ERROR, msg);
};

export const setSignPayloadObject = ({ commit }, payload = {}) => {
  commit(types.UI_SET_SIGN_PAYLOAD_OBJECT, payload);
};

export const showMetaMaskLoginWindow = ({ commit, dispatch }) => {
  commit(types.UI_LOGIN_OVERRIDE, true);
  dispatch('loginUserBySign');
};

export const setErrorDisabled = ({ commit }, bool) => {
  commit(types.UI_DISABLE_ERROR, bool);
};

export const hideLoginWindow = ({ commit }) => {
  commit(types.UI_LOGIN_OVERRIDE, false);
};

export const setWeb3Type = ({ commit }, type) => {
  commit(types.UI_SET_WEB3_TYPE, type);
};

export const startLoading = ({ commit }) => {
  commit(types.UI_START_LOADING);
};

export const stopLoading = ({ commit }) => {
  commit(types.UI_STOP_LOADING);
};

export const setErrorMsg = ({ commit }, msg) => {
  commit(types.UI_ERROR_MSG, msg);
};

export const setInfoMsg = ({ commit }, msg) => {
  commit(types.UI_INFO_MSG, msg);
};

export const setPopupError = ({ commit }, msg) => {
  commit(types.UI_POPUP_ERR, msg);
};

export const setPopupInfo = ({ commit }, msg) => {
  commit(types.UI_POPUP_INFO, msg);
};

export const openPopupDialog = ({ commit }, config) => {
  commit(types.UI_POPUP_OPEN, config);
};

export const closePopupDialog = ({ commit }, uuid) => {
  commit(types.UI_POPUP_CLOSE, uuid);
};

export const setPageHeader = ({ commit }, payload) => {
  commit(types.UI_HEADER_UPDATE, payload);
};

export const closeTxDialog = ({ commit }) => {
  commit(types.UI_CLOSE_TX_DIALOG);
  commit(types.UI_SET_TX_DIALOG_ACTION, { txDialogActionRoute: null, txDialogActionText: '' });
};

export const closeInfoToolbar = ({ commit }) => {
  commit(types.UI_INFO_MSG, '');
};

export const setTxDialogAction = ({ commit }, payload) => {
  commit(types.UI_SET_TX_DIALOG_ACTION, payload);
};

export const openSlidingMenu = ({ commit }) => {
  commit(types.UI_OPEN_SLIDING_MENU);
};

export const closeSlidingMenu = ({ commit }) => {
  commit(types.UI_CLOSE_SLIDING_MENU);
};

export const setPromptNotificationDialog = ({ commit }, payload) => {
  commit(types.UI_SET_PROMPT_NOTIFICATION_DIALOG, payload);
};

export async function setNotification({ commit, dispatch }, payload) {
  try {
    const {
      id,
      isEmailEnabled,
      user,
    } = payload;
    await apiWrapper({
      commit, dispatch,
    }, api.apiSetNotification(id, isEmailEnabled), { blocking: true });
    commit(types.UI_SET_PROMPT_NOTIFICATION_DIALOG, false);
    user.isEmailEnabled = isEmailEnabled;
    commit(types.USER_SET_USER_INFO, user);
  } catch (error) {
    commit(types.UI_STOP_ALL_LOADING);
    commit(types.UI_ERROR_MSG, error.message || error);
    throw error;
  }
}

export const setAuthDialog = ({ commit }, payload) => {
  commit(types.UI_SET_AUTH_DIALOG, payload);
};

export const popupAuthDialogInPlace = ({ commit }, { route }) => {
  commit(types.UI_SET_AUTH_DIALOG, { isShow: true });
  const {
    params,
    name,
    query,
    hash,
  } = route;
  commit(types.USER_SET_AFTER_AUTH_ROUTE, {
    params,
    name,
    query,
    hash,
  });
};

const WALLET_NOTICE_EXPIRY_TIME_KEY = 'wallet_notice_expiry_time';
export const setWalletNoticeDialog = ({ commit }, payload) => {
  // Skip showing dialog if user saw it recently
  if (payload.isShow) {
    let expiryTime = localStorage.getItem(WALLET_NOTICE_EXPIRY_TIME_KEY);
    // Get current time in UNIX timestamp in seconds
    const now = Math.floor(new Date().getTime() / 1000);

    if (expiryTime) {
      if (now < parseInt(expiryTime, 10)) {
        // Do not show dialog if not expired
        payload.onConfirm();
        return;
      }
      expiryTime = null;
    }

    if (!expiryTime) {
      expiryTime = now + WALLET_NOTICE_EXPIRY_INTERVAL;
      localStorage.setItem(WALLET_NOTICE_EXPIRY_TIME_KEY, `${expiryTime}`);
    }
  }

  commit(types.UI_SET_WALLET_NOTICE_DIALOG, payload);
};
