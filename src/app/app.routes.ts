import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Sobre } from './components/sobre/sobre';
import { Login } from './components/login/login';
import { Carrinho } from './components/carrinho/carrinho';
import { Cadastro } from './components/cadastro/cadastro';

export const routes: Routes = [

    {
        path:"",
        redirectTo: "home",
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
        
    { 
        path: "cadastro",
        component: Cadastro },

];