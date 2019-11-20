import Vue from "vue";
import Router from "vue-router";

//it is better to perfomance
const OpenTickets = () => import("@/views/ChamadosAbertos.vue");
const AllTickets = () => import("@/views/ChamadosFechados.vue");
const Login = () => import('@/components/User/Login.vue');
const Register = () => import('@/components/User/Register.vue');
const Profile = () => import('@/components/User/Profile.vue');

/* 
metodo antigo, vi no video (https://www.youtube.com/watch?v=ZbmAgipQ4UM)
que dessa forma acima, fica mais perfomartico

import OpenTickets from "@/components/Chamados/MeusChamados.vue";
import AllTickets from "@/components/Chamados/MeusGrupos.vue";
import Login from '@/components/User/Login.vue';
import Register from '@/components/User/Register.vue';
import Profile from '@/components/User/Profile.vue'; */

Vue.use(Router);

const router = new Router({
  
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/login",
      name: "Login",
      component: Login
    },
    {
      path: "/register",
      name: "Register",
      component: Register
    },
    {
      path: "/profile",
      name: "Profile",
      component: Profile,
    },
    {
      path: "/",
      name: "OpenTickets",
      component: OpenTickets,
    },
    {
      path: "/allTickets",
      name: "AllTickets",
      component: AllTickets, 
    },
  ]
});

export default router;
