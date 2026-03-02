import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ServiceFiltersProps {
    serviceType: 'all' | 'pipeline' | 'global';
    onTypeChange: (v: 'all' | 'pipeline' | 'global') => void;
    pipelineId: string;
    onPipelineChange: (v: string) => void;
    activePipelines: { id: string; name: string }[];
    serviceName: string;
    onNameChange: (v: string) => void;
    uniqueNames: string[];
}

export function ServiceFilters({
    serviceType,
    onTypeChange,
    pipelineId,
    onPipelineChange,
    activePipelines,
    serviceName,
    onNameChange,
    uniqueNames,
}: ServiceFiltersProps) {
    return (
        <>
            {serviceName === 'all' && (
                <Select value={serviceType} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="All Services" />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="all">All Services</SelectItem>
                        <SelectItem value="pipeline">Pipeline Services</SelectItem>
                        <SelectItem value="global">Global Services</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {serviceType !== 'global' && (
                <Select value={pipelineId} onValueChange={onPipelineChange} disabled={serviceType !== 'pipeline'}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="All Pipelines" />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="all">All Pipelines</SelectItem>
                        {activePipelines.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {serviceType !== 'global' && (
                <Select value={serviceName} onValueChange={onNameChange}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="All Service Names" />
                    </SelectTrigger>
                    <SelectContent align="end">
                        <SelectItem value="all">All Service Names</SelectItem>
                        {uniqueNames.map(name => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </>
    );
}