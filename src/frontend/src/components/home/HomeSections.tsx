import { Calendar, Clock, Instagram, Menu, Scissors, X } from "lucide-react";
import {
  IconBrandWhatsapp,
  IconCurrencyReal,
  IconMapPinFilled,
  IconPhone,
  IconUserFilled
} from "@tabler/icons-react";
import { Servico } from "../../types/scheduling";

export function HomeHero({
  menuOpen,
  dataAtual,
  horaAtual,
  onToggleMenu
}: {
  menuOpen: boolean;
  dataAtual: string;
  horaAtual: string;
  onToggleMenu: () => void;
}) {
  return (
    <header className="relative h-screen" id="home">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80")' }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <nav className="relative z-30 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Scissors className="h-8 w-8 text-amber-500" />
          <span className="text-1xl font-bold">Prime</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#home" className="hover:text-amber-500 transition">Início</a>
          <a href="#services" className="hover:text-amber-500 transition">Serviços</a>
          <a href="#booking" className="hover:text-amber-500 transition">Agendamento</a>
          <a href="#contact" className="hover:text-amber-500 transition">Contato</a>
          <a href="/admin" className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition font-semibold">
            <IconUserFilled className="w-4 h-4" />
            Área do Barbeiro
          </a>
        </div>
        <div className="md:hidden flex items-center">
          <button className="focus:outline-none z-50 relative" onClick={onToggleMenu}>
            {menuOpen ? <X className="h-8 w-8 text-amber-500" /> : <Menu className="h-8 w-8 text-amber-500" />}
          </button>
        </div>
      </nav>

      <div className="relative z-10 container mx-auto px-6 h-[calc(100vh-88px)] flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Tradição no corte, atitude no estilo.
            <br />
            Bem-vindo à Barbearia Prime!
          </h1>
          <div className="flex items-center gap-4 text-white mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span className="font-medium">{dataAtual}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="font-mono">{horaAtual}</span>
            </div>
          </div>
          <p className="text-lg md:text-xl mb-8 text-white">
            Agende seu horário online e transforme seu visual com a gente!
          </p>
          <a href="#booking" className="bg-amber-500 text-black px-8 py-4 rounded-md font-semibold hover:bg-amber-600 transition">
            Agende seu Horário
          </a>
        </div>
      </div>
    </header>
  );
}

export function ServicesSection({
  services,
  onSelect
}: {
  services: Servico[];
  onSelect: (service: Servico) => void;
}) {
  return (
    <section id="services" className="py-20 bg-zinc-900 text-center">
      <h2 className="text-5xl font-bold mb-8">Catálogo de serviços</h2>
      <p className="text-white mb-12">Escolha o corte que combina com seu estilo.</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
        {services.map((service, index) => (
          <div key={index} className="bg-zinc-800 p-6 rounded-lg shadow-lg hover:scale-105 transition cursor-pointer" onClick={() => onSelect(service)}>
            <h3 className="text-2xl font-bold text-amber-500 mb-3">{service.nome}</h3>
            <p className="text-white mb-2">
              <IconCurrencyReal size={19.5} className="inline-block mr-1" />
              {service.preco.toFixed(2)}
            </p>
            <p className="text-white flex justify-center items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              {service.duracao}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-zinc-900 text-center">
      <h2 className="text-3xl font-bold mb-4">Entre em contato</h2>
      <p className="text-white mb-6">
        <IconMapPinFilled className="inline-block mr-1" /> Av. s/n Serra<br />
        <IconPhone className="inline-block mr-1" /> (27) 98191-1375
      </p>
      <div className="flex justify-center space-x-8">
        <a href="https://www.instagram.com/imkleitondev/" target="_blank" rel="noreferrer">
          <Instagram className="h-8 w-8 text-amber-500 hover:text-amber-600 transition" />
        </a>
        <a href="https://wa.me/5527981911375" target="_blank" rel="noreferrer">
          <IconBrandWhatsapp className="h-8 w-8 text-green-500 hover:text-green-600 transition" />
        </a>
      </div>
    </section>
  );
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`fixed top-0 right-0 h-full w-80 bg-zinc-950 z-50 transform transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-amber-500">
            <img src="/logo.png" className="h-8 w-8 bg-amber-500 rounded w-8 h-8" />
            <span className="text-xl font-bold">Prime</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition">
            <X className="h-6 w-6 text-white hover:text-amber-500" />
          </button>
        </div>
        <div className="flex flex-col space-y-2 text-lg flex-1">
          <a href="#home" onClick={onClose} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Início</a>
          <a href="#services" onClick={onClose} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Serviços</a>
          <a href="#booking" onClick={onClose} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Agendamento</a>
          <a href="#contact" onClick={onClose} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Contato</a>
          <a href="/admin" onClick={onClose} className="text-amber-500 hover:text-amber-400 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700 font-semibold">Área do barbeiro</a>
        </div>
        <div className="mt-auto pt-6">
          <div className="flex justify-center space-x-6 mb-4">
            <a href="https://www.instagram.com/imkleitondev/" target="_blank" rel="noreferrer" className="p-3 hover:bg-zinc-800 rounded-lg transition">
              <Instagram className="h-6 w-6 text-amber-500 hover:text-amber-600" />
            </a>
            <a href="https://wa.me/5527981911375" target="_blank" rel="noreferrer" className="p-3 hover:bg-zinc-800 rounded-lg transition">
              <IconBrandWhatsapp className="h-6 w-6 text-green-500 hover:text-green-600" />
            </a>
          </div>
          <p className="text-center text-white text-sm"><IconMapPinFilled className="inline-block mr-1" /> Av. s/n, Serra</p>
          <p className="text-center text-white text-sm mt-2"><IconPhone className="inline-block mr-1" /> (27) 98191-1375</p>
        </div>
      </div>
    </div>
  );
}
