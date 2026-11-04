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
import { CatalogoServicos } from './components/catalogo-servicos/catalogo-servicos';
import { CatalogoProdutos } from './components/catalogo-produtos/catalogo-produtos';
import { Funcionarios } from './components/funcionarios/funcionarios';
import { Atendimentos } from './components/atendimentos/atendimentos';
import { Estoque } from './components/estoque/estoque';
import { Categorias } from './components/categorias/categorias';
import { GestaoItens } from './components/gestao-itens/gestao-itens';
import { Pedidos } from './components/pedidos/pedidos';

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
        path: 'catalogo-servicos',
        component: CatalogoServicos
    },

    {
        path: 'catalogo-produtos',
        component: CatalogoProdutos
    },

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

    {
        path: 'funcionarios',
        component: Funcionarios,
        canActivate: [adminGuard]
    },

    {
        path: 'atendimentos',
        component: Atendimentos,
        canActivate: [adminGuard]
    },

    {
        path: 'estoque',
        component: Estoque,
        canActivate: [adminGuard]
    },

    {
        path: 'categorias',
        component: Categorias,
        canActivate: [adminGuard]
    },

    {
        path: 'gerenciar-produtos',
        component: GestaoItens,
        data: { tipo: 'P' },
        canActivate: [adminGuard]
    },

    {
        path: 'gerenciar-servicos',
        component: GestaoItens,
        data: { tipo: 'S' },
        canActivate: [adminGuard]
    },

    {
        path: 'pedidos',
        component: Pedidos,
        canActivate: [adminGuard]
    },

];