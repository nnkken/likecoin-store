<template>
  <base-dialog
    :is-show="shouldShowDialog"
    :md-props="{
      mdBackdrop: !isSinglePage,
      mdClickOutsideToClose: closable,
      mdCloseOnEsc: closable,
      mdFullscreen: true,
      mdClosed: onClosed,
      mdClickOutside: onClosed,
    }"
    :class="[
      'auth-dialog',
      {
        'auth-dialog--blocking': isBlocking,
      },
    ]"
    v-bind="$testID('AuthDialog')"
    is-content-gapless
    @update:isShow="onUpdateIsShow"
    @scroll="onScrollContent"
  >

    <div
      v-if="!isBlocking"
      slot="header-left"
      class="auth-dialog__header-left"
    >
      <a @click="onClickBackButton">{{ $t('General.back') }}</a>
    </div>

    <div
      slot="header-center"
      class="auth-dialog__header-center"
    >
      <div
        :class="[
          'auth-dialog__logo',
          {
            'auth-dialog__logo--small': logoSize <= 60,
          }
        ]"
        :style="`width: ${logoSize}px`"
      >
        <lc-avatar
          v-if="avatar"
          :src="avatar"
          :halo="avatarHalo"
          :size="logoSize >= 72 ? 'large' : 'small'"
          is-full-width
        />
        <template v-else>
          <img :src="LikeCoinLogo">
          <img :src="LikeCoinTextLogo">
        </template>
      </div>
    </div>

    <div
      :style="contentStyle"
      :class="[
        'auth-dialog__content',
        {
          'auth-dialog__content--with-avatar': !!avatar,
        }
      ]"
    >
      <transition-group
        tag="div"
        class="auth-dialog__tab-container"
        name="auth-dialog__tab-"
        appear
        appear-class="auth-dialog__tab--appear"
        @enter="setContentHeight"
      >

        <div
          v-if="currentTab === 'portal'"
          ref="portal"
          key="portal"
          class="auth-dialog__tab auth-dialog__tab--index"
        >
          <signin-portal @submit="signInWithPlatform" />
        </div>

        <div
          v-else-if="currentTab === 'loading'"
          ref="loading"
          key="loading"
          class="auth-dialog__tab lc-padding-vertical-64"
        >
          <div class="lc-dialog-container-1">
            <h1 class="lc-font-size-32 lc-margin-bottom-8 lc-text-align-center lc-mobile">
              {{ $t('AuthDialog.label.loading') }}
            </h1>
          </div>
        </div>

        <!--<div
          v-else-if="currentTab === 'email'"
          ref="email"
          key="email"
          :class="[
            'auth-dialog__tab lc-padding-vertical-16',
            {
              'auth-dialog__tab--index': currentTab === 'checkInbox',
            },
          ]"
        >
          <email-signin-form
            :is-show-back="!isSigningInWithEmail"
            :is-re-enter="errorCode === 'FIREBASE_EMAIL_LINK_AUTH_NO_EMAIL'"
            @submit="signInWithEmail"
            @cancel="currentTab = 'portal'"
          />
        </div>
 -->
        <div
          v-else-if="currentTab === 'register'"
          ref="register"
          key="register"
          class="auth-dialog__tab lc-padding-vertical-16"
        >
          <register-form
            :prefilled-data="signInPayload"
            :is-edit-email="isEmailEditable"
            @register="register"
          />
        </div>

        <div
          v-else-if="currentTab === 'signingIn'"
          ref="signingIn"
          key="signingIn"
          class="auth-dialog__tab lc-padding-vertical-64"
        >
          <div class="lc-dialog-container-1">
            <h1 class="lc-font-size-32 lc-margin-bottom-8 lc-text-align-center lc-mobile">
              {{ $t('AuthDialog.label.signingIn') }}
            </h1>
          </div>
        </div>

        <div
          v-else-if="currentTab === 'error'"
          ref="error"
          key="error"
          class="auth-dialog__tab lc-padding-vertical-16"
        >
          <div class="lc-dialog-container-1">
            <h1 class="lc-font-size-32 lc-margin-bottom-16 lc-mobile">
              {{ errorTitle }}
            </h1>
            <p class="lc-font-size-16 lc-color-like-gray-4 lc-margin-bottom-32">
              {{ errorMessage }}
            </p>

            <!-- Suggest legacy user to login with wallet -->
            <i18n
              v-if="errorMessageForLegacyUser"
              :path="errorMessageForLegacyUser"
              class="lc-font-size-16 lc-color-like-gray-4 lc-margin-bottom-32"
              tag="p"
            >
              <span
                class="lc-color-like-green"
                place="id"
              >{{ signInPayload.user }}</span>
              <span
                class="lc-color-like-green"
                place="email"
              >{{ signInPayload.email }}</span>
              <a
                class="lc-color-light-burgundy lc-underline"
                place="signIn"
                @click="onClickSignWithWalletInError"
              >{{ $t('AuthDialog.Register.signWithWallet') }}</a>
            </i18n>

          </div>

          <div class="lc-dialog-container-1 lc-button-group">
            <md-button
              class="md-likecoin"
              @click="onDismissError"
            >
              {{ errorConfirmTitle }}
            </md-button>
          </div>
        </div>

        <div
          v-else-if="currentTab === 'checkInbox'"
          ref="checkInbox"
          key="checkInbox"
          class="auth-dialog__tab lc-padding-vertical-16"
        >
          <div class="lc-dialog-container-1">
            <h1 class="lc-font-size-32 lc-margin-bottom-8 lc-mobile">
              {{ $t('AuthDialog.label.checkInbox') }}
            </h1>
            <p class="lc-font-size-16 lc-color-like-gray-4 lc-margin-bottom-32">
              {{ $t('AuthDialog.label.checkInboxDescription', {email: signInPayload.email }) }}
            </p>
          </div>
          <div class="lc-dialog-container-1 lc-button-group">
            <md-button
              class="md-likecoin"
              @click="close"
            >
              {{ $t('General.button.ok') }}
            </md-button>
          </div>
        </div>

        <div
          v-else-if="currentTab === 'loginSuccessful'"
          ref="loginSuccessful"
          key="loginSuccessful"
          class="auth-dialog__tab lc-padding-vertical-64"
        >
          <div class="lc-dialog-container-1">
            <h1 class="lc-font-size-32 lc-margin-bottom-8 lc-text-align-center lc-mobile">
              {{ $t('AuthDialog.label.loginSuccessful') }}
            </h1>
          </div>
        </div>

      </transition-group>

    </div>

  </base-dialog>
</template>


<script>
import { mapActions, mapGetters } from 'vuex';

import {
  apiLoginUser,
  apiCheckIsUser,
} from '@/util/api/api';

import {
  firebase,
  firebasePlatformSignIn,
  firebaseSendSignInEmail,
  firebaseIsSignInEmailLink,
  firebaseHandleSignInEmailLink,
} from '~/util/FirebaseApp';

import BaseDialog from '~/components/dialogs/BaseDialog';
import SigninPortal from './AuthDialogContent/SignInPortal';
// import EmailSigninForm from './AuthDialogContent/SignInWithEmail';
import RegisterForm from './AuthDialogContent/Register';
import EthMixin from '~/components/EthMixin';

import User from '@/util/User';

import LikeCoinLogo from '~/assets/icons/likecoin-logo.svg';
import LikeCoinTextLogo from '~/assets/icons/likecoin-text-logo.svg';

import { logTrackerEvent } from '@/util/EventLogger';
import { tryPostLoginRedirect } from '~/util/client';

export default {
  name: 'auth-dialog',
  components: {
    BaseDialog,
    SigninPortal,
    // EmailSigninForm,
    RegisterForm,
  },
  mixins: [
    EthMixin,
  ],
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      LikeCoinLogo,
      LikeCoinTextLogo,

      avatar: undefined,
      avatarHalo: 'none',

      currentTab: 'portal',
      contentStyle: {},
      contentScrollTop: 0,

      platform: '',
      signInPayload: {
        user: '',
        email: '',
        isEmailVerified: false,
      },

      errorCode: '',
      isSigningInWithEmail: false,

      referrer: '',
      sourceURL: '',
      loggedEvents: {},

      hasClickSignWithWalletInError: false,
    };
  },
  computed: {
    ...mapGetters([
      'getIsShowAuthDialog',
      'getCurrentLocale',
      'getMetamaskError',
      'getLocalWallet',
      'getUserMinInfoById',
    ]),
    closable() {
      return !(this.isBlocking || this.isSinglePage);
    },
    isSinglePage() {
      return this.$route.name === 'in-register';
    },
    isBlocking() {
      return this.currentTab === 'loading' || this.currentTab === 'signingIn';
    },
    shouldHideDialog() {
      return !!this.getMetamaskError;
    },
    shouldShowDialog() {
      return this.getIsShowAuthDialog && !this.shouldHideDialog;
    },
    isEmailEditable() {
      return (
        !(this.signInPayload.isEmailVerified && this.platform === 'google')
        && this.platform !== 'email'
      );
    },
    errorTitle() {
      switch (this.errorCode) {
        case 'USER_ALREADY_EXIST':
        case 'EMAIL_ALREADY_USED':
          return this.$t('AuthDialog.Register.error');
        default:
          return this.$t('General.label.error');
      }
    },
    errorMessage() {
      return this.errorCode && this.$i18n.te(`Error.${this.errorCode}`, 'en') ? (
        this.$t(`Error.${this.errorCode}`)
      ) : (
        this.$t('AuthDialog.label.signInError')
      );
    },
    errorMessageForLegacyUser() {
      switch (this.errorCode) {
        case 'USER_ALREADY_EXIST':
        case 'EMAIL_ALREADY_USED':
          return `AuthDialog.Register.suggestWalletSignIn.${
            this.errorCode === 'USER_ALREADY_EXIST' ? 'id' : 'email'
          }`;
        default:
          return '';
      }
    },
    errorConfirmTitle() {
      switch (this.errorCode) {
        case 'USER_ALREADY_EXIST':
        case 'EMAIL_ALREADY_USED':
          return this.$t('General.retry');
        default:
          return this.$t('General.button.confirm');
      }
    },
    logoSize() {
      return Math.max(96 - this.contentScrollTop, 60);
    },
  },
  watch: {
    getIsShowAuthDialog(isShow) {
      if (isShow) {
        // Reset current tab to portal then update the content height
        if (!this.isSigningInWithEmail) {
          this.currentTab = 'portal';
        }
        this.$nextTick(this.setContentHeight);
      }

      // Sync dialog display with query string if not in single page
      if (!this.isSinglePage) {
        const query = { ...this.$route.query };
        if (isShow) {
          // Add show_login=1 in query string
          query.show_login = '1';
        } else {
          // Remove show_login in query string
          delete query.show_login;
        }
        this.$router.replace({ path: this.$route.path, query });
      }

      this.logShowAuthDialog(isShow);
    },
    currentTab(tab) {
      this.contentScrollTop = 0;
      if (tab === 'register' && !this.loggedEvents.register) {
        this.loggedEvents.register = 1;
        logTrackerEvent(this, 'RegFlow', 'ShowRegisterForm', 'ShowRegisterForm', 1);
      }
    },
  },
  async mounted() {
    const { from } = this.$route.query;
    if (from) {
      try {
        if (!this.getUserMinInfoById(from)) {
          await this.fetchUserMinInfo(from);
        }
        const userInfo = this.getUserMinInfoById(from);
        this.avatar = userInfo.avatar;
        this.avatarHalo = User.getAvatarHaloType(userInfo);
      } catch (err) {
        // noop
      }
    }

    // Listen to onClickReturnButton event of MetaMaskDialog
    this.$root.$on('MetaMaskDialog.onClickReturnButton', () => {
      this.stopWeb3Polling();
      this.currentTab = 'portal';
    });

    // Initialize content height
    this.setContentHeight();

    // Show dialog when show_login set to true in query string
    if (this.$route.query.show_login === '1') {
      this.setIsShow(true);
    }

    // Check whether it is email sign in
    if (firebaseIsSignInEmailLink()) {
      this.isSigningInWithEmail = true;
      this.currentTab = 'signingIn';
      this.platform = 'email';
      this.setIsShow(true);
      try {
        this.signInPayload = await firebaseHandleSignInEmailLink();
        this.login();
      } catch (err) {
        if (err.message === 'FIREBASE_EMAIL_LINK_AUTH_NO_EMAIL') {
          // User opened the link on a different device. To prevent session fixation attacks, ask
          // the user to provide the associated email again
          this.currentTab = 'email';
          this.errorCode = 'FIREBASE_EMAIL_LINK_AUTH_NO_EMAIL';
        } else {
          this.setError();
          this.isSigningInWithEmail = false;
        }
      }
    }

    const { referrer } = this.$route.query;
    if (from) this.referrer = from;
    this.sourceURL = referrer || document.referrer;

    this.loggedEvents = {};

    this.logShowAuthDialog(this.getIsShowAuthDialog);
  },
  methods: {
    ...mapActions([
      'newUser',
      'doPostAuthRedirect',
      'setAuthDialog',
      'setWalletNoticeDialog',
      'setUserNeedAuth',
      'refreshUser',
      'fetchUserMinInfo',
      'openPopupDialog',
    ]),
    setContentHeight() {
      const elem = this.$refs[this.currentTab];
      if (elem) {
        this.contentStyle = {
          height: `${elem.offsetHeight}px`,
        };
      }
    },
    setError(code) {
      this.currentTab = 'error';
      this.errorCode = code;
    },
    onClickSignWithWalletInError() {
      this.hasClickSignWithWalletInError = true;
      this.signInWithPlatform('wallet');
    },
    onDismissError() {
      switch (this.errorCode) {
        case 'USER_AUTH_EMAIL_LINK_INVALID':
          // Allow user to re-enter email if the provided email is not match
          this.currentTab = 'email';
          this.errorCode = 'FIREBASE_EMAIL_LINK_AUTH_NO_EMAIL';
          return;

        case 'USER_REGISTER_ERROR':
        case 'EMAIL_ALREADY_USED':
        case 'USER_ALREADY_EXIST':
          this.currentTab = 'register';
          return;

        default:
      }
      this.close();
    },
    onUpdateIsShow(isShow) {
      if (!this.shouldHideDialog) {
        this.setIsShow(isShow);
      }
      if (!isShow && this.errorCode === 'FIREBASE_EMAIL_LINK_AUTH_NO_EMAIL') {
        // Do not retain the step if user closes dialog during re-enter email
        this.currentTab = 'portal';
        this.errorCode = '';
      }
    },
    onScrollContent(e, pos) {
      this.contentScrollTop = pos.scrollTop;
    },
    onClickBackButton() {
      switch (this.currentTab) {
        case 'portal':
          if (this.isSinglePage) {
            if (window.opener) {
              window.close();
            } else {
              this.$router.go(-1);
            }
          } else {
            this.onCancel();
          }
          break;

        default:
          this.currentTab = 'portal';
          break;
      }
    },
    onConfirm() {
      this.setIsShow(false);
      this.$emit('confirm');
      this.onClosed();
    },
    onCancel() {
      this.setIsShow(false);
      this.$emit('cancel');
      this.onClosed();
    },
    onClosed() {
      this.$emit('closed');
    },
    setIsShow(isShow) {
      this.setAuthDialog({ isShow });
    },
    close() {
      this.setIsShow(false);
      this.$nextTick(() => {
        if (this.isSinglePage) {
          if (window.opener) {
            window.close();
          } else {
            this.$router.push({ name: 'index' });
          }
        }
      });
    },
    async signInWithPlatform(platform) {
      this.platform = platform;

      switch (platform) {
        case 'email':
          this.currentTab = 'email';
          return;

        case 'wallet':
          this.currentTab = 'loading';
          this.setWalletNoticeDialog({
            isShow: true,
            cancelTitle: this.$t('WalletNoticeDialog.allSignInOptions'),
            onCancel: () => {
              this.currentTab = 'portal';
            },
            onConfirm: () => this.startWeb3AndCb(this.signInWithWallet),
          });
          return;

        case 'google':
        case 'twitter':
          this.currentTab = 'loading';
          try {
            this.signInPayload = await firebasePlatformSignIn(platform);
          } catch (err) {
            switch (err.code) {
              case 'auth/popup-closed-by-user':
                this.currentTab = 'portal';
                break;

              case 'auth/web-storage-unsupported':
                this.setError('USER_AUTH_THRID_PARTY_COOKIE_BLOCKED');
                break;

              default:
                console.error(err);
                this.setError();
                break;
            }
            return;
          }
          break;

        case 'facebook':
          try {
            this.currentTab = 'loading';

            const {
              accessToken,
              userID,
            } = await new Promise((resolve, reject) => {
              if (!window.FB) {
                reject(new Error('FACEBOOK_SDK_NOT_FOUND'));
              }
              // Determine if a user has authenticated
              window.FB.getLoginStatus((response) => {
                if (response.status === 'connected') {
                  // The user is logged in and has authenticated
                  resolve(response.authResponse);
                } else {
                  // The user has signed but need to renew auth OR
                  // The user hasn't auth OR
                  // The user isn't logged in to Facebook
                  window.FB.login(({ authResponse }) => {
                    if (authResponse) {
                      resolve(authResponse);
                    } else {
                      reject(new Error('FACEBOOK_AUTH_REJECTED'));
                    }
                  }, { scope: 'public_profile,pages_show_list,user_link' });
                }
              });
            });
            this.signInPayload = {
              accessToken,
              platformUserId: userID,
            };

            // Link Facebook with Firebase
            const userCredential = await firebase.auth().signInAndRetrieveDataWithCredential(
              firebase
                .auth
                .FacebookAuthProvider
                .credential(this.signInPayload.accessToken),
            ).catch();
            if (userCredential && userCredential.user) {
              this.signInPayload.firebaseIdToken = await userCredential.user.getIdToken();
            }
          } catch (err) {
            this.currentTab = 'portal';
            return;
          }
          break;

        default:
      }

      this.login();
    },
    async signInWithEmail(email) {
      this.currentTab = 'loading';

      if (this.isSigningInWithEmail) {
        try {
          this.signInPayload = await firebaseHandleSignInEmailLink(email);
          this.isSigningInWithEmail = false;
          this.login();
        } catch (err) {
          let code;
          if (err.code === 'auth/invalid-action-code' || err.code === 'auth/invalid-email') {
            code = 'USER_AUTH_EMAIL_LINK_INVALID';
          } else {
            console.error(err);
            this.isSigningInWithEmail = false;
          }
          this.setError(code);
        }
      } else {
        await firebaseSendSignInEmail(email, {
          referrer: this.referrer,
          sourceURL: this.sourceURL,
        });
        this.currentTab = 'checkInbox';
      }
    },
    async signInWithWallet() {
      this.currentTab = 'signingIn';

      // Determine whether the wallet has registered
      try {
        await apiCheckIsUser(this.getLocalWallet);
      } catch (err) {
        if (err.response) {
          if (err.response.status === 404) {
            this.signInPayload = {
              wallet: this.getLocalWallet,
            };
            this.currentTab = 'register';
            return;
          }
        }

        this.setError();
        return;
      }

      try {
        this.signInPayload = await User.signLogin(this.getLocalWallet);
        this.login();
      } catch (err) {
        if (err.message.indexOf('Invalid "from" address') >= 0) {
          // User has logout MetaMask after EthHelper initialization
          this.currentTab = 'loading';
          this.startWeb3AndCb(this.signInWithWallet, true);
        } else if (err.message.indexOf('User denied message signature') >= 0) {
          // Return to login portal if user denied signing
          this.currentTab = 'portal';
        } else {
          this.setError();
        }
      }
    },
    async login() {
      this.currentTab = 'signingIn';
      try {
        logTrackerEvent(this, 'RegFlow', 'LoginTry', 'LoginTry', 1);
        await apiLoginUser({
          locale: this.getCurrentLocale,
          platform: this.platform,
          ...this.signInPayload,
        });
        this.setUserNeedAuth(false);
        this.redirectAfterSignIn();
      } catch (err) {
        logTrackerEvent(this, 'RegFlow', 'LoginFail', 'LoginFail', 1);
        if (err.response) {
          if (err.response.status === 404) {
            this.preRegister();
            return;
          }
        }
        this.setError();
      }
    },
    async preRegister() {
      logTrackerEvent(this, 'RegFlow', 'PreRegister', 'PreRegister', 1);
      this.currentTab = 'loading';
      const { platformUserId } = this.signInPayload;
      let preRegisterPayload;
      switch (this.platform) {
        case 'facebook':
          // Get user info
          preRegisterPayload = await new Promise((resolve) => {
            if (!window.FB) resolve();
            window.FB.api(
              '/me?fields=name,email',
              ({ name, email }) => {
                // Get avatar
                window.FB.api(
                  `/${platformUserId}/picture?type=large&redirect=0`,
                  ({ data }) => {
                    const payload = {
                      displayName: name,
                    };

                    if (email) {
                      payload.email = email;
                      payload.isEmailVerified = false;
                    }

                    if (data && !data.is_silhouette) {
                      payload.avatarURL = data.url;
                    }

                    resolve(payload);
                  },
                );
              },
            );
          });
          break;

        default:
      }

      if (preRegisterPayload) {
        this.signInPayload = {
          ...this.signInPayload,
          ...preRegisterPayload,
        };
      }

      this.currentTab = 'register';
    },
    async register(registerPayload) {
      this.currentTab = 'loading';

      let payload = {
        locale: this.getCurrentLocale,
        platform: this.platform,
        ...this.signInPayload,
        ...registerPayload,
      };
      this.signInPayload = payload;

      // Request user to sign when using wallet to sign in
      if (payload.wallet) {
        payload = await User.formatAndSignUserInfo(
          payload,
          this.$t('Sign.Message.registerUser'),
        );
      }
      if (this.referrer) payload.referrer = this.referrer;
      if (this.sourceURL) payload.sourceURL = this.sourceURL;

      this.currentTab = 'signingIn';
      try {
        await this.newUser(payload);
        logTrackerEvent(this, 'RegFlow', 'RegistrationComplete', 'RegistrationComplete', 1);
        this.setUserNeedAuth(false);
        this.redirectAfterSignIn();
      } catch (err) {
        let errCode;
        if (err.response && err.response.data) {
          switch (err.response.data) {
            case 'USER_ALREADY_EXIST':
            case 'EMAIL_ALREADY_USED':
              errCode = err.response.data;
              break;

            case 'FIREBASE_USER_DUPLICATED':
              errCode = 'USER_ALREADY_EXIST';
              break;

            default:
              console.error(err);
          }
        } else {
          console.error(err);
          errCode = 'USER_REGISTER_ERROR';
        }
        this.setError(errCode);
        logTrackerEvent(this, 'RegFlow', 'RegistrationFail', 'RegistrationFail', 1);
      }
    },
    async redirectAfterSignIn() {
      this.currentTab = 'loading';
      await this.refreshUser();

      this.setIsShow(false);
      if (this.isSinglePage) {
        this.currentTab = 'loginSuccessful';
        this.$nextTick(() => {
          if (!tryPostLoginRedirect({ route: this.$route })) {
            // Normal case
            this.redirectToPreAuthPage();
          }
        });
      } else {
        this.$nextTick(() => { this.redirectToPreAuthPage(); });
      }
    },
    redirectToPreAuthPage() {
      const router = this.$router;
      const route = this.$route;
      this.doPostAuthRedirect({ router, route });

      // Remind a suspect legacy user to bind OAuth login
      if (this.hasClickSignWithWalletInError) {
        this.openPopupDialog({
          allowClose: true,
          header: this.$t('AuthDialog.Failure.BindSocialAccounts.header'),
          message: this.$t('AuthDialog.Failure.BindSocialAccounts.message'),
          cancelText: this.$t('General.button.cancel'),
          confirmText: this.$t('AuthDialog.Failure.BindSocialAccounts.confirm'),
          onConfirm: () => {
            this.$router.push({
              name: 'in-settings',
              hash: '#connect',
            });
          },
        });
      }
      // Reset register failure count
      this.hasClickSignWithWalletInError = false;
    },
    logShowAuthDialog(isShow) {
      if (isShow && !this.loggedEvents.showAuthDialog) {
        this.loggedEvents.showAuthDialog = 1;
        logTrackerEvent(this, 'RegFlow', 'ShowAuthDialog', 'ShowAuthDialog', 1);
      }
    },
  },
};
</script>


<style lang="scss" scoped>
@import '~assets/variables';
@import "~assets/mixin";

.lc-dialog {
  :global(.lc-dialog-header::before) {
    background: linear-gradient(246deg, #d2f0f0, #f0e6b4);
  }
}

.auth-dialog {
  :global(.lc-dialog-header) {
    z-index: 1;
  }

  &--blocking {
    :global(.lc-dialog-header::before) {
      @include background-image-sliding-animation-x(
        linear-gradient(to right, #ed9090, #ee6f6f 20%, #ecd7d7, #ed9090)
      );
    }
  }

  &__header-left {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    display: none;
    align-items: center;

    padding-left: 16px;

    @media screen and (max-width: 600px) {
      display: flex;
    }
  }

  &__header-center {
    padding-top: 16px;
  }

  &__logo {
    position: absolute;
    top: 16px;

    width: 96px;

    transform: translateX(-50%);

    > img:nth-child(2) {
      transition: opacity 0.25s ease;
    }

    &--small {
      > img:nth-child(2) {
        opacity: 0;
      }
    }
  }

  &__content {
    overflow: hidden;

    margin-top: 82px;

    transition: height 1s ease;

    &--with-avatar {
      margin-top: 64px;
    }
  }

  &__tab-container {
    position: relative;
  }

  &__tab {
    position: absolute;

    width: 100%;

    transition-timing-function: ease;
    transition-duration: 1s;
    transition-property: opacity, transform;
    will-change: opacity, transform;

    &-- {
      &appear,
      &enter,
      &leave-to {
        opacity: 0;
      }

      &appear {
        transform: translateY(25%) scaleY(1.2);
      }

      &enter {
        transform: scale(1.1) translateY(50%);
      }

      &enter#{&}index {
        transform: scale(0.8);
      }

      &leave-to {
        transform: scale(0.8) translateY(50%);
      }
    }
  }
}
</style>
