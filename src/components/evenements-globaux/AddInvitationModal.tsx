import { Fragment, useState, useEffect } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlobalEventInvitation, PartnershipData, LightweightPartner, GlobalEvent, InvitationStatus } from '@/types';

interface AddInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invitation: GlobalEventInvitation, lightweightPartner?: LightweightPartner) => Promise<void>;
    existingPartners: PartnershipData[];
    lightweightPartners: LightweightPartner[];
    event: GlobalEvent;
    editingInvitation?: GlobalEventInvitation; // Optional prop for editing
}

export default function AddInvitationModal({
    isOpen,
    onClose,
    onSave,
    existingPartners,
    lightweightPartners,
    event,
    editingInvitation
}: AddInvitationModalProps) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [selectedPartnerId, setSelectedPartnerId] = useState('');
    const [newContact, setNewContact] = useState({
        name: '',
        email: '',
        company: ''
    });
    const [notes, setNotes] = useState('');
    const [guests, setGuests] = useState<string[]>([]);
    const [currentGuest, setCurrentGuest] = useState('');
    const [status, setStatus] = useState<InvitationStatus>('pending');

    useEffect(() => {
        if (isOpen) {
            if (editingInvitation) {
                // Determine mode based on whether partner exists in existingPartners
                const existingPartner = existingPartners.find(p => p.partner.id === editingInvitation.partnerId);

                if (existingPartner) {
                    setMode('existing');
                    setSelectedPartnerId(editingInvitation.partnerId);
                } else {
                    setMode('new');
                    // Try to find lightweight partner info if available
                    const lp = lightweightPartners.find(l => l.id === editingInvitation.partnerId);
                    setNewContact({
                        name: editingInvitation.partnerName,
                        email: lp?.email || '',
                        company: lp?.company || ''
                    });
                }

                setNotes(editingInvitation.notes || '');
                setGuests(editingInvitation.guests || []);
                setStatus(editingInvitation.status);
            } else {
                // Reset for new invitation
                setMode('existing');
                setSelectedPartnerId('');
                setNewContact({ name: '', email: '', company: '' });
                setNotes('');
                setGuests([]);
                setStatus('pending');
            }
            setCurrentGuest('');
        }
    }, [isOpen, editingInvitation, existingPartners, lightweightPartners]);

    const handleAddGuest = (e: React.MouseEvent) => {
        e.preventDefault();
        if (currentGuest.trim()) {
            setGuests([...guests, currentGuest.trim()]);
            setCurrentGuest('');
        }
    };

    const handleRemoveGuest = (index: number) => {
        setGuests(guests.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let invitation: GlobalEventInvitation;
            let lightweightPartner: LightweightPartner | undefined;

            if (mode === 'existing') {
                const partner = existingPartners.find(p => p.partner.id === selectedPartnerId);
                if (!partner) {
                    alert('Veuillez sélectionner un partenaire');
                    setLoading(false);
                    return;
                }

                invitation = {
                    partnerId: partner.partner.id,
                    partnerName: partner.partner.name,
                    status: status,
                    proposalDate: new Date().toISOString(),
                    responseDate: (status !== 'proposed' && status !== 'pending') ? new Date().toISOString() : undefined,
                    notes: notes || undefined,
                    guests: guests.length > 0 ? guests : undefined
                };
            } else {
                if (!newContact.name) {
                    alert('Le nom est requis');
                    setLoading(false);
                    return;
                }

                const id = crypto.randomUUID();
                lightweightPartner = {
                    id,
                    name: newContact.name,
                    email: newContact.email || undefined,
                    company: newContact.company || undefined,
                    isLightweight: true
                };

                invitation = {
                    partnerId: id,
                    partnerName: newContact.name,
                    status: status,
                    proposalDate: new Date().toISOString(),
                    responseDate: (status !== 'proposed' && status !== 'pending') ? new Date().toISOString() : undefined,
                    notes: notes || undefined,
                    guests: guests.length > 0 ? guests : undefined
                };
            }

            await onSave(invitation, lightweightPartner);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erreur lors de l\'ajout');
        } finally {
            setLoading(false);
        }
    };

    // Filter out partners already invited
    const availablePartners = existingPartners.filter(p =>
        !event.invitations.find(inv => inv.partnerId === p.partner.id)
    );

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-2xl glass-card rounded-2xl border border-white/10 flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                                <Dialog.Title className="text-xl font-bold text-white">
                                    {editingInvitation ? 'Modifier l\'Invitation' : 'Inviter un Partenaire'}
                                </Dialog.Title>
                                <button onClick={onClose} className="text-white/60 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <Tab.Group selectedIndex={mode === 'existing' ? 0 : 1} onChange={(index) => {
                                    if (!editingInvitation) setMode(index === 0 ? 'existing' : 'new');
                                }}>
                                    <Tab.List className="flex gap-2 p-1 bg-black/20 rounded-xl mb-6">
                                        <Tab
                                            disabled={!!editingInvitation}
                                            className={({ selected }) =>
                                                `flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${selected
                                                    ? 'bg-white/10 text-white shadow'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                } ${editingInvitation ? 'opacity-50 cursor-not-allowed' : ''}`
                                            }
                                        >
                                            Partenaire existant
                                        </Tab>
                                        <Tab
                                            disabled={!!editingInvitation}
                                            className={({ selected }) =>
                                                `flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${selected
                                                    ? 'bg-white/10 text-white shadow'
                                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                                } ${editingInvitation ? 'opacity-50 cursor-not-allowed' : ''}`
                                            }
                                        >
                                            Nouveau contact
                                        </Tab>
                                    </Tab.List>

                                    <Tab.Panels>
                                        <Tab.Panel>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Sélectionner un partenaire *</label>
                                                    <select
                                                        required
                                                        value={selectedPartnerId}
                                                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                                                        disabled={!!editingInvitation}
                                                        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 ${editingInvitation ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <option value="">-- Choisir un partenaire --</option>
                                                        {availablePartners.map(p => (
                                                            <option key={p.partner.id} value={p.partner.id}>
                                                                {p.partner.name}
                                                            </option>
                                                        ))}
                                                        {editingInvitation && mode === 'existing' && (
                                                            <option value={editingInvitation.partnerId}>
                                                                {editingInvitation.partnerName}
                                                            </option>
                                                        )}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Statut de l'invitation *</label>
                                                    <select
                                                        required
                                                        value={status}
                                                        onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                                    >
                                                        <option value="proposed">Proposé</option>
                                                        <option value="pending">En attente</option>
                                                        <option value="accepted">Accepté</option>
                                                        <option value="declined">Refusé</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Personnes invitées (optionnel)</label>
                                                    <div className="flex gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={currentGuest}
                                                            onChange={(e) => setCurrentGuest(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleAddGuest(e as any)}
                                                            placeholder="Nom de l'invité"
                                                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:border-primary-400"
                                                        />
                                                        <Button type="button" variant="secondary" onClick={handleAddGuest} className="shrink-0 px-3 sm:px-4">
                                                            <span className="hidden sm:inline">Ajouter</span>
                                                            <span className="sm:hidden">+</span>
                                                        </Button>
                                                    </div>
                                                    {guests.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {guests.map((guest, index) => (
                                                                <div key={index} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                                                                    <span>{guest}</span>
                                                                    <button type="button" onClick={() => handleRemoveGuest(index)} className="hover:text-red-400">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Notes (optionnel)</label>
                                                    <textarea
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Informations complémentaires..."
                                                        rows={3}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 resize-none"
                                                    />
                                                </div>

                                                <div className="flex justify-center sm:justify-end gap-3 pt-4">
                                                    <Button type="button" variant="secondary" onClick={onClose}>
                                                        Annuler
                                                    </Button>
                                                    <Button type="submit" variant="primary" disabled={loading}>
                                                        {loading ? 'Enregistrement...' : (editingInvitation ? 'Mettre à jour' : 'Ajouter')}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Tab.Panel>

                                        <Tab.Panel>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Nom *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={newContact.name}
                                                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Nom du contact"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        value={newContact.email}
                                                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="email@exemple.com"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Entreprise</label>
                                                    <input
                                                        type="text"
                                                        value={newContact.company}
                                                        onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                                                        placeholder="Nom de l'entreprise"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Statut de l'invitation *</label>
                                                    <select
                                                        required
                                                        value={status}
                                                        onChange={(e) => setStatus(e.target.value as InvitationStatus)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                                                    >
                                                        <option value="proposed">Proposé</option>
                                                        <option value="pending">En attente</option>
                                                        <option value="accepted">Accepté</option>
                                                        <option value="declined">Refusé</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Personnes invitées (optionnel)</label>
                                                    <div className="flex gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={currentGuest}
                                                            onChange={(e) => setCurrentGuest(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleAddGuest(e as any)}
                                                            placeholder="Nom de l'invité"
                                                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:border-primary-400"
                                                        />
                                                        <Button type="button" variant="secondary" onClick={handleAddGuest} className="shrink-0 px-3 sm:px-4">
                                                            <span className="hidden sm:inline">Ajouter</span>
                                                            <span className="sm:hidden">+</span>
                                                        </Button>
                                                    </div>
                                                    {guests.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {guests.map((guest, index) => (
                                                                <div key={index} className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm text-white">
                                                                    <span>{guest}</span>
                                                                    <button type="button" onClick={() => handleRemoveGuest(index)} className="hover:text-red-400">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Notes (optionnel)</label>
                                                    <textarea
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        placeholder="Informations complémentaires..."
                                                        rows={3}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 resize-none"
                                                    />
                                                </div>

                                                <div className="flex justify-center sm:justify-end gap-3 pt-4">
                                                    <Button type="button" variant="secondary" onClick={onClose}>
                                                        Annuler
                                                    </Button>
                                                    <Button type="submit" variant="primary" disabled={loading}>
                                                        {loading ? 'Ajout...' : 'Ajouter'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
