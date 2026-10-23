import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Sobre } from './components/sobre/sobre';
import { Login } from './components/login/login';
import { Carrinho } from './components/carrinho/carrinho';

export const routes: Routes = [

    {
        path:"",
        redirectTo: "tela-inicial",
        pathMatch: "full",

    },

    { 
        path: "home",
        component: Home },

    { 
        path: "sobre",
        component: Sobre },

    { 
        path: "carrinho",
        component: Carrinho },

    { 
        path: "login",
        component: Login },
        

];