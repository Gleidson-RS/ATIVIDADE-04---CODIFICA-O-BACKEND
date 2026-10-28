import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultarCliente } from './consultar-cliente';

describe('ConsultarCliente', () => {
  let component: ConsultarCliente;
  let fixture: ComponentFixture<ConsultarCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarCliente],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultarCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
