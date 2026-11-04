import { Injectable } from '@angular/core';
import { Pessoas } from '../../models/pessoas/pessoa';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { PessoaService } from '../pessoa/pessoa-service';

/**
 * Operações de cliente que dependem de regras extras sobre a API PessoaEndereco.
 * Usa o PessoaService para as chamadas HTTP (sem duplicar URL nem cliente HTTP).
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(private pessoaService: PessoaService) {}

  listarClientes(): Observable<Pessoas[]> {
    return this.pessoaService.listarPessoas();
  }

  consultarCliente(id: number): Observable<Pessoas> {
    return this.pessoaService.listarPessoa(id);
  }

  editarCliente(id: number, cliente: unknown): Observable<string> {
    return this.pessoaService.alterarPessoa(id, cliente);
  }

  // Exclui o cliente SEM precisar alterar o back-end:
  // 1) PUT sem endereços (a API remove os que não vierem no corpo)
  // 2) DELETE da pessoa, que agora não tem mais endereços
  // 3) Se o DELETE falhar, tenta devolver os endereços (rollback)
  excluirCliente(cliente: any): Observable<string> {
    const id = Number(cliente.id);
    const dataNasc = String(cliente.datanascimento ?? '').substring(0, 10);

    const base = {
      id,
      idPessoa: id,
      nome: cliente.nome,
      CPF: String(cliente.CPF ?? ''),
      datanascimento: dataNasc,
      sexo: cliente.sexo,
      email: cliente.email,
      telefone: String(cliente.telefone ?? ''),
      AtivoPessoa: cliente.AtivoPessoa
    };

    // Endereços sem id: se precisar restaurar, entram como novos
    const enderecosOriginais = (cliente.Enderecos ?? []).map((e: any) => ({
      CEP: String(e.cep ?? e.CEP ?? '').replace(/\D/g, ''),
      numero: String(e.numero ?? ''),
      complemento: e.complemento ?? ''
    }));

    return this.editarCliente(id, { ...base, Enderecos: [] }).pipe(
      switchMap(() =>
        this.pessoaService.excluirPessoa(id).pipe(
          catchError((erroDelete) =>
            this.editarCliente(id, { ...base, Enderecos: enderecosOriginais }).pipe(
              catchError(() => of('')),
              switchMap(() => throwError(() => erroDelete))
            )
          )
        )
      )
    );
  }
}
