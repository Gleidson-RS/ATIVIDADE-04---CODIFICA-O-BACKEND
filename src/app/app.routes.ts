import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Sobre } from './components/sobre/sobre';
import { Login } from './components/login/login';
import { Carrinho } from './components/carrinho/carrinho';
import { Cadastro } from './components/Cliente/cadastro-cliente/cadastro';
import { Portal } from './components/portal/portal';
import { ListarClientes } from './components/Cliente/listar-clientes/listar-clientes';
import { EditarCliente } from './components/Cliente/editar-cliente/editar-cliente';
import { ConsultarCliente } from './components/Cliente/consultar-cliente/consultar-cliente';
import { PortalLogin } from './components/portal-login/portal-login';
import { adminGuard } from './guards/admin.guard';

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

    { 
        path: "portal-login",
        component: PortalLogin },

    { 
        path: "portal",
        component: Portal,
        canActivate: [adminGuard] },

    { 
        path: "consultar-cliente/:id",
        component: ConsultarCliente,
        canActivate: [adminGuard] },
        
    { 
        path: "editar-cliente/:id",
        component: EditarCliente,
        canActivate: [adminGuard] },

    { 
        path: "listar-clientes",
        component: ListarClientes,
        canActivate: [adminGuard] },

];