<template>
  <el-row class="layout-login">
    <el-col :span="6" class="layout-login__main">
      <slot/>
    </el-col>
    <el-col :span="18" class="layout-login__background">
      <el-row>
        <el-col :offset="2" :span="12" class="layout-login__inner-text">
          <h1>CYODA platform</h1>
          <p>
            Why is it so hard to build data intensive systems?<br/>
            It doesn’t have to be that way.
          </p>

          <p>
            Cyoda as a Service will enable developers to build systems faster and more easily than ever before.
          </p>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.layout-login {
  &__main {
    min-height: 100vh;
    height: auto;
    background: #EFF2EC;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  &__background {
    min-height: 100vh;
    height: auto;
    background: #38b291 url("@/assets/images/bigdata-green.jpg") 0 0 no-repeat;
    background-size: cover;
    background-position: 50%;
  }

  &__inner-text {
    color: #fff;
    padding-top: 15%;

    h1 {
      font-size: 48px;
    }

    p {
      font-size: 20px;
    }

    p + p {
      margin-top: 50px;
    }
  }
}
</style>
