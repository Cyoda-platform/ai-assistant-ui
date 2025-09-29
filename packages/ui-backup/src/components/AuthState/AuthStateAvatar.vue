<template>
  <div class="auth_state_avatar">
    <template v-if="picture">
      <img @click.stop="onToggleCard" class="auth_state_avatar__image auth_state_avatar__icon" :src="picture">
    </template>
    <template v-else>
      <div @click.stop="onToggleCard" class="auth_state_avatar__initials auth_state_avatar__icon">
        {{ initials }}
      </div>
    </template>

    <el-card ref="cardRef" v-if="visibleCard" class="auth_state_avatar__card">
      <template #header>
        <div class="card-header">
          <span>{{ email }}</span>
        </div>
      </template>
      <a @click="onClickSettings" class="auth_state_avatar__link" href="#">
        <SettingsIcon class="main-icon"/>
        {{ t('side_bar.links.settings') }}
      </a>
      <template #footer>
        <a @click="onClickLogout" href="#" class="auth_state_avatar__link">
          <LogoutIcon class="logout-icon"/>
          <span>
          {{ t('side_bar.logout') }}
        </span>
        </a>
      </template>
    </el-card>
    <SettingsDialog ref="settingsDialogRef"/>
  </div>
</template>

<script setup lang="ts">
import useAuthStore from "@/stores/auth";
import {computed, onBeforeUnmount, onMounted, ref, useTemplateRef} from "vue";
import SettingsIcon from '@/assets/images/icons/settings.svg';
import LogoutIcon from '@/assets/images/icons/logout.svg';
import {useI18n} from "vue-i18n";
import SettingsDialog from "@/components/SettingsDialog/SettingsDialog.vue";
import {useAuth0} from "@auth0/auth0-vue";
import {useRouter} from "vue-router";

const settingsDialogRef = useTemplateRef('settingsDialogRef');
const cardRef = useTemplateRef('cardRef');


const authStore = useAuthStore();
const {t} = useI18n();
const {logout} = useAuth0();
const router = useRouter();
const visibleCard = ref(false);

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const picture = computed(() => {
  return authStore.picture;
})

const initials = computed(() => {
  const {family_name = 'C', given_name = 'U'} = authStore;

  const familyInitial = family_name.charAt(0).toUpperCase();
  const givenInitial = given_name.charAt(0).toUpperCase();

  return `${givenInitial}${familyInitial}`;
});

const email = computed(() => {
  return authStore.email;
})

function onClickSettings() {
  visibleCard.value = false;
  settingsDialogRef.value.openDialog();
}

function onClickLogout() {
  visibleCard.value = false;
  const isElectron = import.meta.env.VITE_IS_ELECTRON;
  
  if (isElectron) {
    authStore.logout();
    router.push('/');
  } else {
    authStore.logout(() => {
      logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    });
    router.push('/');
  }
}

function onToggleCard() {
  visibleCard.value = !visibleCard.value;
}

function handleClickOutside(event) {
  if (!visibleCard.value) return;
  if (cardRef.value && !cardRef.value?.$el.contains(event.target)) {
    visibleCard.value = false;
  }
}

</script>

<style scoped lang="scss">
.auth_state_avatar {
  height: 32px;
  position: relative;

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 100%;
    cursor: pointer;
  }

  &__initials {
    display: inline-block;
    background-color: var(--version-app-background);
    text-align: center;
    line-height: 32px;
  }

  &__card {
    position: absolute;
    right: 0;
    top: 40px;
    min-width: 300px;
    padding: 0 15px;

    ::v-deep(.el-card__header){
      padding: 15px 0;
    }

    ::v-deep(.el-card__body){
      padding: 10px 0;
    }

    ::v-deep(.el-card__footer) {
      padding: 10px 0;
    }
  }

  &__link {
    display: flex;
    align-items: center;
    font-size: 16px;
    min-height: 40px;
    color: var(--text-color-regular);
    text-decoration: none;
    width: 100%;

    .main-icon {
      margin-right: 8px;
      fill: var(--text-color-regular);
    }

    .logout-icon {
      margin-right: 8px;
    }
  }

  .card-header{
    color: var(--text-color-regular);
    font-weight: bold;
  }
}
</style>
