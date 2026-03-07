import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';
import { Zap, Calendar } from 'lucide-react';

const formSchema = z.object({
    fromTime: z.string().min(1, 'From time is required'),
    toTime: z.string().min(1, 'To time is required'),
    deltaMs: z.coerce.number().min(0, 'Delta must be positive'),
    queryIntervalMs: z.coerce.number().min(0, 'Query interval must be positive'),
});

type FormValues = z.infer<typeof formSchema>;

export function BroadBackfillDialog() {
    const [open, setOpen] = useState(false);
    const { broadBackfill } = useAppStore();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fromTime: '',
            toTime: '',
            deltaMs: 60000,
            queryIntervalMs: 10000,
        },
    });

    async function onSubmit(values: FormValues) {
        setSubmitting(true);
        try {
            await broadBackfill(values as import('@/types').BackfillRequest);
            toast.success('Broad backfill request submitted successfully');
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error('Failed to submit backfill request');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-xs h-8 border-[#333] hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] transition-all">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Broad Backfill
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Broad Backfill Request</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground font-mono">
                        Trigger a manual broad-range data backfill.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fromTime"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs mb-1">From Time</FormLabel>
                                        <FormControl>
                                            <div className="relative w-full flex items-center">
                                                <Input type="datetime-local" {...field} className="h-9 w-full text-xs bg-surface-1 pl-3 pr-10 py-1 cursor-text relative z-0" />
                                                <Calendar className="absolute right-3 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="toTime"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs mb-1">To Time</FormLabel>
                                        <FormControl>
                                            <div className="relative w-full flex items-center">
                                                <Input type="datetime-local" {...field} className="h-9 w-full text-xs bg-surface-1 pl-3 pr-10 py-1 cursor-text relative z-0" />
                                                <Calendar className="absolute right-3 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="deltaMs"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs mb-1">Delta (ms)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="h-9 w-full text-xs bg-surface-1 px-3" />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="queryIntervalMs"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-xs mb-1">Query Interval (ms)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="h-9 w-full text-xs bg-surface-1 px-3" />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="submit" disabled={submitting} className="w-full h-9 text-xs">
                                {submitting ? 'Submitting...' : 'Submit Backfill'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
