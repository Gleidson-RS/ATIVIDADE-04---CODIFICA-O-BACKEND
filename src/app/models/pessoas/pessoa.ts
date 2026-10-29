import { Enderecos } from "../enderecos/enderecos"

export class Pessoas{
    id: number = 0
    nome: string = ''
    CPF: number | string = 0
    datanascimento: string = ''
    sexo: string = ''
    email: string = ''
    telefone: number | string = 0
    AtivoPessoa: string = ''
    Enderecos: Enderecos[] = [];
}